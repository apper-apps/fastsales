import appointmentsData from '@/services/mockData/appointments.json';

class AppointmentsService {
  constructor() {
    this.appointments = [...appointmentsData];
    this.nextId = Math.max(...this.appointments.map(a => a.Id), 0) + 1;
  }

  async getAll() {
    return [...this.appointments];
  }

  async getById(id) {
    const appointment = this.appointments.find(a => a.Id === parseInt(id));
    if (!appointment) {
      throw new Error('Appointment not found');
    }
    return { ...appointment };
  }

  async getByLeadId(leadId) {
    return this.appointments.filter(a => a.leadId === parseInt(leadId));
  }

  async getUpcoming() {
    const now = new Date();
    return this.appointments.filter(a => 
      new Date(a.scheduledDateTime) > now && 
      a.status !== 'cancelled'
    ).sort((a, b) => new Date(a.scheduledDateTime) - new Date(b.scheduledDateTime));
  }

  async getByDateRange(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return this.appointments.filter(a => {
      const appointmentDate = new Date(a.scheduledDateTime);
      return appointmentDate >= start && appointmentDate <= end;
    });
  }

  async create(appointmentData) {
    const appointment = {
      Id: this.nextId++,
      leadId: appointmentData.leadId,
      type: appointmentData.type,
      title: appointmentData.title,
      description: appointmentData.description || '',
      scheduledDateTime: appointmentData.scheduledDateTime,
      duration: appointmentData.duration || 60,
      status: 'scheduled',
      location: appointmentData.location || '',
      notes: appointmentData.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      reminders: appointmentData.reminders || []
    };

    this.appointments.push(appointment);
    return { ...appointment };
  }

  async update(id, updateData) {
    const index = this.appointments.findIndex(a => a.Id === parseInt(id));
    if (index === -1) {
      throw new Error('Appointment not found');
    }

    const updatedAppointment = {
      ...this.appointments[index],
      ...updateData,
      Id: parseInt(id),
      updatedAt: new Date().toISOString()
    };

    this.appointments[index] = updatedAppointment;
    return { ...updatedAppointment };
  }

  async updateStatus(id, status) {
    return this.update(id, { status });
  }

  async delete(id) {
    const index = this.appointments.findIndex(a => a.Id === parseInt(id));
    if (index === -1) {
      throw new Error('Appointment not found');
    }

    const deletedAppointment = this.appointments.splice(index, 1)[0];
    return { ...deletedAppointment };
  }

  async reschedule(id, newDateTime) {
    const appointment = await this.getById(id);
    if (appointment.status === 'completed' || appointment.status === 'cancelled') {
      throw new Error('Cannot reschedule completed or cancelled appointments');
    }

    return this.update(id, {
      scheduledDateTime: newDateTime,
      status: 'rescheduled'
    });
  }

  async complete(id, notes = '') {
    const appointment = await this.getById(id);
    if (appointment.status === 'cancelled') {
      throw new Error('Cannot complete cancelled appointment');
    }

    return this.update(id, {
      status: 'completed',
      completedAt: new Date().toISOString(),
      notes: notes || appointment.notes
    });
  }

  async cancel(id, reason = '') {
    const appointment = await this.getById(id);
    if (appointment.status === 'completed') {
      throw new Error('Cannot cancel completed appointment');
    }

    return this.update(id, {
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
      cancellationReason: reason
    });
  }

  getAppointmentTypes() {
    return [
      { value: 'presentation', label: 'Product Presentation', icon: 'Presentation', duration: 90 },
      { value: 'follow_up', label: 'Follow-up Call', icon: 'Phone', duration: 30 },
      { value: 'meeting', label: 'In-Person Meeting', icon: 'Users', duration: 60 },
      { value: 'consultation', label: 'Consultation', icon: 'MessageCircle', duration: 45 },
      { value: 'training', label: 'Training Session', icon: 'BookOpen', duration: 120 },
      { value: 'closing', label: 'Closing Meeting', icon: 'Handshake', duration: 60 }
    ];
  }

  getStatusOptions() {
    return [
      { value: 'scheduled', label: 'Scheduled', color: 'blue' },
      { value: 'confirmed', label: 'Confirmed', color: 'green' },
      { value: 'rescheduled', label: 'Rescheduled', color: 'yellow' },
      { value: 'completed', label: 'Completed', color: 'green' },
      { value: 'cancelled', label: 'Cancelled', color: 'red' },
      { value: 'no_show', label: 'No Show', color: 'gray' }
    ];
  }
}

const appointmentsService = new AppointmentsService();
export default appointmentsService;