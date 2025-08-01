import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import appointmentsService from "@/services/api/appointmentsService";
import leadsService from "@/services/api/leadsService";
import CalendarView from "@/components/organisms/CalendarView";
import AppointmentScheduleModal from "@/components/organisms/AppointmentScheduleModal";
import Loading from "@/components/ui/Loading";
import Error from "@/components/ui/Error";
import Empty from "@/components/ui/Empty";
import ApperIcon from "@/components/ApperIcon";
import Button from "@/components/atoms/Button";
import { Card } from "@/components/atoms/Card";
import { format } from "date-fns";

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [view, setView] = useState("calendar"); // calendar or list

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const [appointmentsData, leadsData] = await Promise.all([
        appointmentsService.getAll(),
        leadsService.getAll()
      ]);
      setAppointments(appointmentsData);
      setLeads(leadsData);
    } catch (err) {
      setError("Failed to load appointments data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAppointmentClick = (appointment) => {
    setSelectedAppointment(appointment);
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
  };

  const handleAppointmentAdd = async (leadId, appointmentData) => {
    await loadData();
    return appointmentData;
  };

  const getLeadName = (leadId) => {
    const lead = leads.find(l => l.Id === leadId);
    return lead ? lead.name : 'Unknown Lead';
  };

  const upcomingAppointments = appointments
    .filter(a => new Date(a.scheduledDateTime) > new Date() && a.status !== 'cancelled')
    .sort((a, b) => new Date(a.scheduledDateTime) - new Date(b.scheduledDateTime))
    .slice(0, 5);

  if (loading) return <Loading />;
  if (error) return <Error message={error} onRetry={loadData} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">
            Appointments
          </h1>
          <p className="text-gray-600">
            Manage and schedule appointments with your leads
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setView("calendar")}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                view === "calendar"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <ApperIcon name="Calendar" size={16} className="mr-1 inline" />
              Calendar
            </button>
            <button
              onClick={() => setView("list")}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                view === "list"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <ApperIcon name="List" size={16} className="mr-1 inline" />
              List
            </button>
          </div>
          <Button
            onClick={() => setIsScheduleModalOpen(true)}
            className="flex items-center"
          >
            <ApperIcon name="Plus" size={16} className="mr-2" />
            Schedule Appointment
          </Button>
        </div>
      </div>

      {view === "calendar" ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <CalendarView
              onAppointmentClick={handleAppointmentClick}
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
            />
          </div>
          <div className="space-y-6">
            <Card className="p-4">
              <h3 className="font-medium text-gray-900 mb-4 flex items-center">
                <ApperIcon name="Clock" size={16} className="mr-2" />
                Upcoming Appointments
              </h3>
              {upcomingAppointments.length > 0 ? (
                <div className="space-y-3">
                  {upcomingAppointments.map(appointment => (
                    <div key={appointment.Id} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-sm text-gray-900">{appointment.title}</p>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {appointment.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">{getLeadName(appointment.leadId)}</p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(appointment.scheduledDateTime), "MMM dd, h:mm a")}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No upcoming appointments</p>
              )}
            </Card>
          </div>
        </div>
      ) : (
        <Card className="p-6">
          {appointments.length === 0 ? (
            <Empty
              title="No appointments"
              description="Start by scheduling your first appointment with a lead to track meetings and follow-ups."
              icon="Calendar"
            />
          ) : (
            <div className="space-y-4">
              {appointments.map(appointment => (
                <div key={appointment.Id} className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-medium text-gray-900">{appointment.title}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                          appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {appointment.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        {getLeadName(appointment.leadId)} • {format(new Date(appointment.scheduledDateTime), "MMM dd, yyyy 'at' h:mm a")}
                      </p>
                      {appointment.location && (
                        <p className="text-sm text-gray-500 flex items-center">
                          <ApperIcon name="MapPin" size={14} className="mr-1" />
                          {appointment.location}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      <AppointmentScheduleModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        lead={leads[0]} // Default to first lead for demo
        onAppointmentAdd={handleAppointmentAdd}
      />
    </div>
  );
};

export default Appointments;