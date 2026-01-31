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
import { HealthTourismService } from './health-tourism.service';
import { JwtAuthGuard } from '../common/guards/auth.guard';
import { GetTenantId, GetUser } from '../common/decorators/user.decorator';

@Controller('health-tourism')
@UseGuards(JwtAuthGuard)
export class HealthTourismController {
  constructor(private readonly healthTourismService: HealthTourismService) {}

  // --- Patients ---
  @Post('patients')
  createPatient(
    @GetTenantId() tenantId: string,
    @GetUser() user: any,
    @Body() data: any,
  ) {
    return this.healthTourismService.createPatient(tenantId, user.id, data);
  }

  @Get('patients')
  findAllPatients(@GetTenantId() tenantId: string) {
    return this.healthTourismService.findAllPatients(tenantId);
  }

  @Get('patients/:id')
  findOnePatient(@GetTenantId() tenantId: string, @Param('id') id: string) {
    return this.healthTourismService.findOnePatient(tenantId, id);
  }

  @Patch('patients/:id')
  updatePatient(
    @GetTenantId() tenantId: string,
    @GetUser() user: any,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    return this.healthTourismService.updatePatient(tenantId, user.id, id, data);
  }

  @Delete('patients/:id')
  deletePatient(
    @GetTenantId() tenantId: string,
    @GetUser() user: any,
    @Param('id') id: string,
  ) {
    return this.healthTourismService.deletePatient(tenantId, user.id, id);
  }

  // --- Treatments ---
  @Post('treatments')
  createTreatment(
    @GetTenantId() tenantId: string,
    @GetUser() user: any,
    @Body() data: any,
  ) {
    return this.healthTourismService.createTreatment(tenantId, user.id, data);
  }

  @Patch('treatments/:id')
  updateTreatment(
    @GetTenantId() tenantId: string,
    @GetUser() user: any,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    return this.healthTourismService.updateTreatment(tenantId, user.id, id, data);
  }

  @Delete('treatments/:id')
  deleteTreatment(
    @GetTenantId() tenantId: string,
    @GetUser() user: any,
    @Param('id') id: string,
  ) {
    return this.healthTourismService.deleteTreatment(tenantId, user.id, id);
  }

  // --- Transfers ---
  @Post('transfers')
  createTransfer(
    @GetTenantId() tenantId: string,
    @GetUser() user: any,
    @Body() data: any,
  ) {
    return this.healthTourismService.createTransfer(tenantId, user.id, data);
  }

  @Patch('transfers/:id')
  updateTransfer(
    @GetTenantId() tenantId: string,
    @GetUser() user: any,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    return this.healthTourismService.updateTransfer(tenantId, user.id, id, data);
  }

  @Delete('transfers/:id')
  deleteTransfer(
    @GetTenantId() tenantId: string,
    @GetUser() user: any,
    @Param('id') id: string,
  ) {
    return this.healthTourismService.deleteTransfer(tenantId, user.id, id);
  }

  // --- Accommodations ---
  @Post('accommodations')
  createAccommodation(
    @GetTenantId() tenantId: string,
    @GetUser() user: any,
    @Body() data: any,
  ) {
    return this.healthTourismService.createAccommodation(tenantId, user.id, data);
  }

  @Patch('accommodations/:id')
  updateAccommodation(
    @GetTenantId() tenantId: string,
    @GetUser() user: any,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    return this.healthTourismService.updateAccommodation(tenantId, user.id, id, data);
  }

  @Delete('accommodations/:id')
  deleteAccommodation(
    @GetTenantId() tenantId: string,
    @GetUser() user: any,
    @Param('id') id: string,
  ) {
    return this.healthTourismService.deleteAccommodation(tenantId, user.id, id);
  }

  // --- Appointments ---
  @Post('appointments')
  createAppointment(
    @GetTenantId() tenantId: string,
    @GetUser() user: any,
    @Body() data: any,
  ) {
    return this.healthTourismService.createAppointment(tenantId, user.id, data);
  }

  @Patch('appointments/:id')
  updateAppointment(
    @GetTenantId() tenantId: string,
    @GetUser() user: any,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    return this.healthTourismService.updateAppointment(tenantId, user.id, id, data);
  }

  @Delete('appointments/:id')
  deleteAppointment(
    @GetTenantId() tenantId: string,
    @GetUser() user: any,
    @Param('id') id: string,
  ) {
    return this.healthTourismService.deleteAppointment(tenantId, user.id, id);
  }

  // --- Documents ---
  @Post('documents')
  createDocument(
    @GetTenantId() tenantId: string,
    @GetUser() user: any,
    @Body() data: any,
  ) {
    return this.healthTourismService.createDocument(tenantId, user.id, data);
  }

  @Patch('documents/:id')
  updateDocument(
    @GetTenantId() tenantId: string,
    @GetUser() user: any,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    return this.healthTourismService.updateDocument(tenantId, user.id, id, data);
  }

  @Delete('documents/:id')
  deleteDocument(
    @GetTenantId() tenantId: string,
    @GetUser() user: any,
    @Param('id') id: string,
  ) {
    return this.healthTourismService.deleteDocument(tenantId, user.id, id);
  }

  // --- Automation Rules ---
  @Post('automations')
  createAutomationRule(
    @GetTenantId() tenantId: string,
    @GetUser() user: any,
    @Body() data: any,
  ) {
    return this.healthTourismService.createAutomationRule(tenantId, user.id, data);
  }

  @Get('automations')
  findAllAutomationRules(@GetTenantId() tenantId: string) {
    return this.healthTourismService.findAllAutomationRules(tenantId);
  }

  @Patch('automations/:id')
  updateAutomationRule(
    @GetTenantId() tenantId: string,
    @GetUser() user: any,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    return this.healthTourismService.updateAutomationRule(tenantId, user.id, id, data);
  }

  @Delete('automations/:id')
  deleteAutomationRule(
    @GetTenantId() tenantId: string,
    @GetUser() user: any,
    @Param('id') id: string,
  ) {
    return this.healthTourismService.deleteAutomationRule(tenantId, user.id, id);
  }
}
