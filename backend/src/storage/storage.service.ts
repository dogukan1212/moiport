import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFolderDto } from './dto/create-folder.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class StorageService {
  private readonly uploadDir = 'uploads/storage';

  constructor(private prisma: PrismaService) {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async createFolder(createFolderDto: CreateFolderDto, tenantId: string) {
    if (createFolderDto.parentId) {
      const parent = await this.prisma.storageFolder.findFirst({
        where: { id: createFolderDto.parentId, tenantId },
      });
      if (!parent) throw new NotFoundException('Parent folder not found');
    }

    return this.prisma.storageFolder.create({
      data: {
        name: createFolderDto.name,
        parentId: createFolderDto.parentId,
        customerId: createFolderDto.customerId,
        tenantId,
      },
    });
  }

  async getFolderContents(folderId: string | null, user: any) {
    const tenantId = user.tenantId;
    const isClient = user.role === 'CLIENT';
    const customerId = user.customerId;

    // Sync customer folders if in root (ONLY if not Client, clients shouldn't trigger sync)
    if (!folderId && !isClient) {
      await this.syncCustomerFolders(tenantId);
    }

    // Client Logic: Override Root
    if (isClient && !folderId) {
        // Find their folder
        if (customerId) {
            const myFolder = await this.prisma.storageFolder.findFirst({
                where: { customerId: customerId, tenantId, isSystem: true }
            });
            
            if (myFolder) {
                folderId = myFolder.id;
            } else {
                // If not found, try to ensure it? Or return empty
                 const newFolder = await this.ensureCustomerFolder(customerId, tenantId);
                 folderId = newFolder?.id || null;
            }
        }
    }

    if (isClient && !folderId) {
        return {
            currentFolder: null,
            folders: [],
            files: [],
            breadcrumbs: []
        };
    }

    // If folderId is provided (or set by Client override), verify it exists and belongs to tenant
    let currentFolder: any = null;
    if (folderId) {
      currentFolder = await this.prisma.storageFolder.findFirst({
        where: { id: folderId, tenantId },
        include: { parent: true },
      });
      if (!currentFolder) throw new NotFoundException('Folder not found');
      
      // Client Access Check
      if (isClient) {
          // Allow if:
          // 1. It is THEIR folder
          // 2. It is a subfolder of THEIR folder (we need to check ancestry)
          // 3. It is a public folder? (Not yet implemented fully)
          
          // Simple check: Is this folder owned by them?
          if (currentFolder.customerId === customerId) {
              // OK
          } else {
              // Check ancestry
              const isDescendant = await this.isFolderDescendantOfCustomer(folderId, customerId);
              if (!isDescendant) {
                  throw new BadRequestException('Erişim engellendi');
              }
          }
      }
    }

    // Filter sub-folders
    const folderWhere: any = { parentId: folderId, tenantId };
    
    // If Client is at Root (and somehow didn't get redirected above, e.g. folderId still null), 
    // they shouldn't see anything or only their folder.
    // But we redirected them to their folderId above.
    
    // However, inside their folder, they should see subfolders.
    
    const folders = await this.prisma.storageFolder.findMany({
      where: folderWhere,
      orderBy: { name: 'asc' },
    });

    // Filter files
    const fileWhere: any = { folderId: folderId, tenantId };

    if (isClient) {
        fileWhere.OR = [
            { isPublic: true },
            { uploaderId: user.id }
        ];
    }
    
    const files = await this.prisma.storageFile.findMany({
      where: fileWhere,
      orderBy: { name: 'asc' },
    });
    
    // Public filter?
    // If Client, maybe they can also see files marked isPublic in this folder?
    // The current logic assumes if they have access to the FOLDER, they see everything in it.
    // That seems correct for "Private Customer Folder".

    const filesWithBigInt = files.map(f => ({
      ...f,
      size: Number(f.size)
    }));

    return {
      currentFolder,
      folders,
      files: filesWithBigInt,
      breadcrumbs: await this.getBreadcrumbs(folderId, tenantId, user),
    };
  }

  private async isFolderDescendantOfCustomer(folderId: string, customerId: string): Promise<boolean> {
      let currentId = folderId;
      while(currentId) {
          const folder = await this.prisma.storageFolder.findUnique({
              where: { id: currentId },
              select: { id: true, parentId: true, customerId: true }
          });
          if (!folder) return false;
          if (folder.customerId === customerId) return true;
          if (!folder.parentId) return false;
          currentId = folder.parentId;
      }
      return false;
  }

  private async getBreadcrumbs(folderId: string | null, tenantId: string, user: any) {
    const breadcrumbs: any[] = [];
    let currentId = folderId;
    const isClient = user?.role === 'CLIENT';

    while (currentId) {
      const folder = await this.prisma.storageFolder.findUnique({
        where: { id: currentId },
        select: { id: true, name: true, parentId: true, tenantId: true, customerId: true },
      });

      if (!folder || folder.tenantId !== tenantId) break; // Security check
      
      // If Client, stop breadcrumb at their root folder
      if (isClient && folder.customerId === user.customerId) {
           breadcrumbs.unshift(folder);
           break; // Don't go higher to "Müşteriler" or Root
      }

      breadcrumbs.unshift(folder);
      currentId = folder.parentId;
    }

    return breadcrumbs;
  }

  async getFileStream(fileId: string, user: any) {
    const tenantId = user.tenantId;
    const file = await this.prisma.storageFile.findFirst({
        where: { id: fileId, tenantId },
        include: { folder: true }
    });

    if (!file) throw new NotFoundException('File not found');

    // Security Check
    if (user.role === 'CLIENT') {
        // If file is Public, allow access (Assuming isPublic means visible to customer if they have link, or just visible in general?)
        // If isPublic is true, we should probably allow access even without strict folder check? 
        // But usually isPublic means "Shared with Client".
        // Let's stick to folder access logic unless isPublic is true.
        
        if (!file.isPublic) {
             if (!file.folderId) throw new BadRequestException('Erişim engellendi');
             
             if (file.folder?.customerId === user.customerId) {
                 // OK
             } else {
                 const isDescendant = await this.isFolderDescendantOfCustomer(file.folderId, user.customerId);
                 if (!isDescendant) {
                     throw new BadRequestException('Erişim engellendi');
                 }
             }
        }
    }

    if (!fs.existsSync(file.path)) {
        throw new NotFoundException('Physical file not found');
    }

    const stream = fs.createReadStream(file.path);
    return {
        stream,
        mimeType: file.mimeType,
        size: Number(file.size),
        name: file.originalName
    };
  }

  async uploadFile(file: any, folderId: string | null, user: any, isPublic: boolean = false) {
    const tenantId = user.tenantId;
    const uploaderId = user.id;
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    
    if (!tenant) throw new NotFoundException('Tenant not found');

    // Security Check for Clients
    if (user.role === 'CLIENT') {
        if (!folderId) {
             throw new BadRequestException('Müşteriler ana dizine dosya yükleyemez');
        }
        
        // Verify folder ownership/ancestry
        const folder = await this.prisma.storageFolder.findUnique({ where: { id: folderId }});
        if (!folder || folder.tenantId !== tenantId) throw new NotFoundException('Folder not found');

        if (folder.customerId === user.customerId) {
            // OK
        } else {
            const isDescendant = await this.isFolderDescendantOfCustomer(folderId, user.customerId);
            if (!isDescendant) {
                 throw new BadRequestException('Bu klasöre dosya yükleme yetkiniz yok');
            }
        }
    }

    // Quota Check
    const fileSizeBigInt = BigInt(file.size);
    const currentUsed = tenant.storageUsed || BigInt(0);
    
    let maxStorageBytes = BigInt(0);

    // 1. Check if tenant has specific override
    if (tenant.maxStorage) {
        maxStorageBytes = BigInt(tenant.maxStorage);
    } else {
        // 2. Check Plan definition
        const planCode = tenant.subscriptionPlan || 'STARTER';
        const plan = await this.prisma.plan.findUnique({ where: { code: planCode } });
        
        if (plan && plan.maxStorage) {
             // Plan storage is in MB, convert to Bytes
             maxStorageBytes = BigInt(plan.maxStorage) * BigInt(1024 * 1024);
        } else {
             // 3. Fallback defaults if Plan not found
             if (planCode === 'PRO') maxStorageBytes = BigInt(100) * BigInt(1024 * 1024 * 1024); // 100GB
             else if (planCode === 'ENTERPRISE') maxStorageBytes = BigInt(500) * BigInt(1024 * 1024 * 1024); // 500GB
             else maxStorageBytes = BigInt(1) * BigInt(1024 * 1024 * 1024); // 1GB (Starter default)
        }
    }

    if (currentUsed + fileSizeBigInt > maxStorageBytes) {
      throw new BadRequestException('Storage quota exceeded');
    }

    // Determine path
    const tenantDir = path.join(this.uploadDir, tenantId);
    if (!fs.existsSync(tenantDir)) {
      fs.mkdirSync(tenantDir, { recursive: true });
    }

    // Generate safe filename
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    const filePath = path.join(tenantDir, uniqueName);

    // Save file
    fs.writeFileSync(filePath, file.buffer);

    // DB Record
    const savedFile = await this.prisma.storageFile.create({
      data: {
        name: file.originalname,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: fileSizeBigInt,
        path: filePath, // Store relative path? Better to store consistent path.
        provider: 'LOCAL',
        folderId: folderId,
        tenantId,
        uploaderId,
        isPublic,
      },
    });

    // Update Quota
    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        storageUsed: { increment: fileSizeBigInt },
      },
    });

    return {
      ...savedFile,
      size: Number(savedFile.size)
    };
  }

  async deleteFile(fileId: string, user: any) {
    const tenantId = user.tenantId;
    const file = await this.prisma.storageFile.findFirst({
      where: { id: fileId, tenantId },
      include: { folder: true }
    });

    if (!file) throw new NotFoundException('File not found');

    // Security Check for Clients
    if (user.role === 'CLIENT') {
        // Can only delete files in their folders
        if (!file.folderId) {
             throw new BadRequestException('Bu dosyayı silme yetkiniz yok');
        }
        
        // Check folder ancestry
        // Optimization: Check direct parent first
        if (file.folder?.customerId === user.customerId) {
            // OK
        } else {
            const isDescendant = await this.isFolderDescendantOfCustomer(file.folderId, user.customerId);
            if (!isDescendant) {
                throw new BadRequestException('Bu dosyayı silme yetkiniz yok');
            }
        }
    }

    // Delete physical file
    if (fs.existsSync(file.path)) {
      try {
        fs.unlinkSync(file.path);
      } catch (e) {
        console.error('File deletion error:', e);
      }
    }

    // Delete DB record
    await this.prisma.storageFile.delete({ where: { id: fileId } });

    // Update Quota
    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        storageUsed: { decrement: file.size },
      },
    });

    return { message: 'File deleted' };
  }

  async deleteFolder(folderId: string, user: any) {
    const tenantId = user.tenantId;
    const folder = await this.prisma.storageFolder.findFirst({
      where: { id: folderId, tenantId },
      include: { files: true, children: true },
    });

    if (!folder) throw new NotFoundException('Folder not found');

    // Security Check for Clients
    if (user.role === 'CLIENT') {
        // Can only delete subfolders of their folder, NOT their root folder (usually)
        // Or maybe they CAN delete their root folder? No, "ensureCustomerFolder" would recreate it.
        // But deleting their root folder might be bad if it has system flag.
        
        if (folder.customerId === user.customerId) {
             // This is their Root folder?
             // If they delete it, ensureCustomerFolder will recreate it empty.
             // But usually we might want to prevent deleting the root.
             // However, for now, let's allow if not system?
        }
        
        if (folder.isSystem) {
             throw new BadRequestException('Sistem klasörleri silinemez.');
        }

        // Check ancestry (parent must be owned by them or be them)
        if (!folder.parentId) throw new BadRequestException('Yetkisiz işlem');
        
        const isDescendant = await this.isFolderDescendantOfCustomer(folder.parentId, user.customerId); // Check parent
        // Wait, if folder.customerId is set, it might be the root.
        
        // If I am deleting a folder, I must have write access to its PARENT.
        // Or be the owner of the folder itself (but recursively).
        
        // Simpler: Is this folder inside my tree?
        const isMyTree = await this.isFolderDescendantOfCustomer(folderId, user.customerId);
        if (!isMyTree && folder.customerId !== user.customerId) { // Allow if it is the root customer folder? No, system check handles that.
             throw new BadRequestException('Bu klasörü silme yetkiniz yok');
        }
    }

    if (folder.files.length > 0 || folder.children.length > 0) {
      throw new BadRequestException('Klasör boş değil. Lütfen önce içeriğini silin.');
    }
    
    if (folder.isSystem) {
        throw new BadRequestException('Sistem klasörleri silinemez.');
    }

    await this.prisma.storageFolder.delete({ where: { id: folderId } });
    return { message: 'Folder deleted' };
  }

  async updateFile(fileId: string, isPublic: boolean, user: any) {
    const tenantId = user.tenantId;
    const file = await this.prisma.storageFile.findFirst({
        where: { id: fileId, tenantId },
        include: { folder: true }
    });

    if (!file) throw new NotFoundException('File not found');

    // Security Check for Clients
    if (user.role === 'CLIENT') {
        // Can only update files in their folders
        if (!file.folderId) {
             throw new BadRequestException('Bu dosyayı düzenleme yetkiniz yok');
        }
        
        // Check folder ancestry
        if (file.folder?.customerId === user.customerId) {
            // OK
        } else {
            const isDescendant = await this.isFolderDescendantOfCustomer(file.folderId, user.customerId);
            if (!isDescendant) {
                throw new BadRequestException('Bu dosyayı düzenleme yetkiniz yok');
            }
        }
    }

    return this.prisma.storageFile.update({
        where: { id: fileId },
        data: { isPublic }
    });
  }

  async moveFile(fileId: string, targetFolderId: string | null, user: any) {
    const tenantId = user.tenantId;
    
    // 1. Find the file
    const file = await this.prisma.storageFile.findFirst({
        where: { id: fileId, tenantId },
        include: { folder: true }
    });
    if (!file) throw new NotFoundException('File not found');

    // 2. Validate Target Folder
    if (targetFolderId) {
        const targetFolder = await this.prisma.storageFolder.findFirst({
            where: { id: targetFolderId, tenantId }
        });
        if (!targetFolder) throw new NotFoundException('Target folder not found');
        
        // Prevent moving into itself (not applicable for files, but good practice for folders)
        // Check if target is same as current
        if (file.folderId === targetFolderId) return file; // No change
    }

    // 3. Security Check for Clients
    if (user.role === 'CLIENT') {
        // Can only move THEIR files
        if (!file.folderId) throw new BadRequestException('Yetkisiz işlem');
        
        // Source Check
        if (file.folder?.customerId !== user.customerId) {
             const isDescendant = await this.isFolderDescendantOfCustomer(file.folderId, user.customerId);
             if (!isDescendant) throw new BadRequestException('Yetkisiz işlem');
        }

        // Target Check
        if (targetFolderId) {
            const isTargetDescendant = await this.isFolderDescendantOfCustomer(targetFolderId, user.customerId);
             // Also check if target is the root customer folder
             const targetFolder = await this.prisma.storageFolder.findUnique({ where: { id: targetFolderId }});
             if (targetFolder?.customerId !== user.customerId && !isTargetDescendant) {
                 throw new BadRequestException('Hedef klasöre erişim yetkiniz yok');
             }
        } else {
            // Client cannot move to Root (null)
            throw new BadRequestException('Ana dizine taşıma yetkiniz yok');
        }
    }

    // 4. Update
    return this.prisma.storageFile.update({
        where: { id: fileId },
        data: { folderId: targetFolderId }
    });
  }

  async syncCustomerFolders(tenantId: string) {
    const customers = await this.prisma.customer.findMany({
      where: { tenantId },
      select: { id: true },
    });

    for (const customer of customers) {
      // Check if folder exists
      const existing = await this.prisma.storageFolder.findFirst({
        where: { tenantId, customerId: customer.id, isSystem: true },
      });

      if (!existing) {
        await this.ensureCustomerFolder(customer.id, tenantId);
      }
    }
  }

  async ensureCustomerFolder(customerId: string, tenantId: string) {
    const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) return;

    // Check if folder exists
    const existing = await this.prisma.storageFolder.findFirst({
      where: { tenantId, customerId, isSystem: true },
    });

    if (existing) return existing;

    // Check/Create Root "Customers" folder
    let rootCustomers = await this.prisma.storageFolder.findFirst({
      where: { tenantId, name: 'Müşteriler', parentId: null, isSystem: true },
    });

    if (!rootCustomers) {
      rootCustomers = await this.prisma.storageFolder.create({
        data: {
          name: 'Müşteriler',
          tenantId,
          isSystem: true,
        },
      });
    }

    // Create Customer Folder
    return this.prisma.storageFolder.create({
      data: {
        name: customer.name, // Use customer name
        parentId: rootCustomers.id,
        tenantId,
        customerId,
        isSystem: true,
      },
    });
  }
}
