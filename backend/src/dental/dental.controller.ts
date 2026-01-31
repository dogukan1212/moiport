import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { DentalService } from './dental.service';
import { JwtAuthGuard } from '../common/guards/auth.guard';
import { GetTenantId, GetUser } from '../common/decorators/user.decorator';

@Controller('dental')
@UseGuards(JwtAuthGuard)
export class DentalController {
  constructor(private readonly dentalService: DentalService) {}

  // --- Patients ---
  @Post('patients')
  createPatient(
    @GetTenantId() tenantId: string,
    @GetUser() user: any,
    @Body() data: any,
  ) {
    return this.dentalService.createPatient(tenantId, user.id, data);
  }

  @Get('patients')
  findAllPatients(@GetTenantId() tenantId: string) {
    return this.dentalService.findAllPatients(tenantId);
  }

  @Get('patients/:id')
  findOnePatient(@GetTenantId() tenantId: string, @Param('id') id: string) {
    return this.dentalService.findOnePatient(tenantId, id);
  }

  @Patch('patients/:id')
  updatePatient(
    @GetTenantId() tenantId: string,
    @GetUser() user: any,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    return this.dentalService.updatePatient(tenantId, user.id, id, data);
  }

  @Delete('patients/:id')
  deletePatient(
    @GetTenantId() tenantId: string,
    @GetUser() user: any,
    @Param('id') id: string,
  ) {
    return this.dentalService.deletePatient(tenantId, user.id, id);
  }

  @Patch('patients/:id/teeth/:number')
  updateTooth(
    @GetTenantId() tenantId: string,
    @GetUser() user: any,
    @Param('id') patientId: string,
    @Param('number') number: string,
    @Body() data: any,
  ) {
    return this.dentalService.updateTooth(tenantId, user.id, patientId, parseInt(number), data);
  }

  // --- Treatments ---
  @Post('treatments')
  createTreatment(
    @GetTenantId() tenantId: string,
    @GetUser() user: any,
    @Body() data: any,
  ) {
    return this.dentalService.createTreatment(tenantId, user.id, data);
  }

  @Patch('treatments/:id')
  updateTreatment(
    @GetTenantId() tenantId: string,
    @GetUser() user: any,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    return this.dentalService.updateTreatment(tenantId, user.id, id, data);
  }

  @Delete('treatments/:id')
  deleteTreatment(
    @GetTenantId() tenantId: string,
    @GetUser() user: any,
    @Param('id') id: string,
  ) {
    return this.dentalService.deleteTreatment(tenantId, user.id, id);
  }

  // --- Lab Orders ---
  @Post('lab-orders')
  createLabOrder(
    @GetTenantId() tenantId: string,
    @GetUser() user: any,
    @Body() data: any,
  ) {
    return this.dentalService.createLabOrder(tenantId, user.id, data);
  }

  @Patch('lab-orders/:id')
  updateLabOrder(
    @GetTenantId() tenantId: string,
    @GetUser() user: any,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    return this.dentalService.updateLabOrder(tenantId, user.id, id, data);
  }

  @Delete('lab-orders/:id')
  deleteLabOrder(
    @GetTenantId() tenantId: string,
    @GetUser() user: any,
    @Param('id') id: string,
  ) {
    return this.dentalService.deleteLabOrder(tenantId, user.id, id);
  }

  // --- Images ---
  @Post('images')
  createImage(
    @GetTenantId() tenantId: string,
    @GetUser() user: any,
    @Body() data: any,
  ) {
    return this.dentalService.createImage(tenantId, user.id, data);
  }

  @Delete('images/:id')
  deleteImage(
    @GetTenantId() tenantId: string,
    @GetUser() user: any,
    @Param('id') id: string,
  ) {
    return this.dentalService.deleteImage(tenantId, user.id, id);
  }
}
