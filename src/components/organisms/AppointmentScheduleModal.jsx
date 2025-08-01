import React, { useState } from "react";
import { format, addHours } from "date-fns";
import { toast } from "react-toastify";
import appointmentsService from "@/services/api/appointmentsService";
import ApperIcon from "@/components/ApperIcon";
import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input";
import Label from "@/components/atoms/Label";
import Select from "@/components/atoms/Select";
import { Card } from "@/components/atoms/Card";
import FormField from "@/components/molecules/FormField";

const AppointmentScheduleModal = ({ isOpen, onClose, lead, onAppointmentAdd }) => {
  const [appointmentData, setAppointmentData] = useState({
    type: "presentation",
    title: "",
    description: "",
    scheduledDateTime: format(addHours(new Date(), 24), "yyyy-MM-dd'T'HH:mm"),
    duration: 60,
    location: "",
    notes: "",
    reminders: []
  });
  const [loading, setLoading] = useState(false);

  const appointmentTypes = appointmentsService.getAppointmentTypes();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!appointmentData.title.trim()) {
      toast.error("Please enter a title for the appointment");
      return;
    }

    if (!appointmentData.scheduledDateTime) {
      toast.error("Please select a date and time");
      return;
    }

    const scheduledDate = new Date(appointmentData.scheduledDateTime);
    if (scheduledDate <= new Date()) {
      toast.error("Please select a future date and time");
      return;
    }

    setLoading(true);
    try {
      const selectedType = appointmentTypes.find(type => type.value === appointmentData.type);
      
      const appointmentToCreate = {
        ...appointmentData,
        leadId: lead.Id,
        title: appointmentData.title.trim(),
        description: appointmentData.description.trim(),
        scheduledDateTime: new Date(appointmentData.scheduledDateTime).toISOString(),
        duration: selectedType?.duration || appointmentData.duration,
        location: appointmentData.location.trim(),
        notes: appointmentData.notes.trim(),
        reminders: [
          { type: "email", minutes: 1440 }, // 24 hours
          { type: "sms", minutes: 60 } // 1 hour
        ]
      };

      const newAppointment = await appointmentsService.create(appointmentToCreate);
      
      if (onAppointmentAdd) {
        await onAppointmentAdd(lead.Id, newAppointment);
      }
      
      // Reset form
      setAppointmentData({
        type: "presentation",
        title: "",
        description: "",
        scheduledDateTime: format(addHours(new Date(), 24), "yyyy-MM-dd'T'HH:mm"),
        duration: 60,
        location: "",
        notes: "",
        reminders: []
      });
      
      onClose();
      toast.success(`Appointment scheduled successfully for ${format(new Date(newAppointment.scheduledDateTime), "MMM dd, yyyy 'at' h:mm a")}`);
    } catch (error) {
      console.error('Error creating appointment:', error);
      toast.error("Failed to schedule appointment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleTypeChange = (e) => {
    const selectedType = appointmentTypes.find(type => type.value === e.target.value);
    setAppointmentData(prev => ({
      ...prev,
      type: e.target.value,
      duration: selectedType?.duration || 60,
      title: prev.title || `${selectedType?.label} - ${lead.name}`
    }));
  };

  if (!isOpen) return null;

  const selectedType = appointmentTypes.find(type => type.value === appointmentData.type);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                <ApperIcon name="Calendar" size={20} className="text-primary-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Schedule Appointment</h2>
                <p className="text-sm text-gray-600">with {lead?.name}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <ApperIcon name="X" size={20} />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              label="Appointment Type"
              type="select"
              value={appointmentData.type}
              onChange={handleTypeChange}
              options={appointmentTypes}
              required
            />

            <FormField
              label="Title"
              type="text"
              value={appointmentData.title}
              onChange={(e) => setAppointmentData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter appointment title..."
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Date & Time"
                type="datetime-local"
                value={appointmentData.scheduledDateTime}
                onChange={(e) => setAppointmentData(prev => ({ ...prev, scheduledDateTime: e.target.value }))}
                required
              />

              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Select
                  id="duration"
                  value={appointmentData.duration}
                  onChange={(e) => setAppointmentData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours</option>
                  <option value={120}>2 hours</option>
                </Select>
              </div>
            </div>

            <FormField
              label="Location"
              type="text"
              value={appointmentData.location}
              onChange={(e) => setAppointmentData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="Meeting location or platform (Zoom, Office, etc.)"
            />

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={appointmentData.description}
                onChange={(e) => setAppointmentData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="What will be discussed in this appointment?"
                className="w-full min-h-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-y"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Preparation Notes</Label>
              <textarea
                id="notes"
                value={appointmentData.notes}
                onChange={(e) => setAppointmentData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Notes for preparation or things to remember..."
                className="w-full min-h-16 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-y"
                rows={2}
              />
            </div>

            {selectedType && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <div className="flex items-center">
                  <ApperIcon name={selectedType.icon} size={16} className="text-blue-600 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">
                      {selectedType.label}
                    </p>
                    <p className="text-xs text-blue-600">
                      Default duration: {selectedType.duration} minutes
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-green-50 border border-green-200 rounded-md p-3">
              <div className="flex items-center">
                <ApperIcon name="Bell" size={16} className="text-green-600 mr-2" />
                <p className="text-sm text-green-800">
                  Automatic reminders will be sent 24 hours and 1 hour before the appointment
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 flex items-center justify-center"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <ApperIcon name="Loader2" size={16} className="mr-2 animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  <>
                    <ApperIcon name="Calendar" size={16} className="mr-2" />
                    Schedule Appointment
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
};

export default AppointmentScheduleModal;