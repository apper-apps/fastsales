import React, { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths } from "date-fns";
import { toast } from "react-toastify";
import appointmentsService from "@/services/api/appointmentsService";
import ApperIcon from "@/components/ApperIcon";
import Button from "@/components/atoms/Button";
import { Card } from "@/components/atoms/Card";
import Loading from "@/components/ui/Loading";
import Error from "@/components/ui/Error";

const CalendarView = ({ onAppointmentClick, selectedDate, onDateSelect }) => {
  const [currentDate, setCurrentDate] = useState(selectedDate || new Date());
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAppointments = async () => {
    try {
      setLoading(true);
      setError("");
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      const data = await appointmentsService.getByDateRange(start, end);
      setAppointments(data);
    } catch (err) {
      setError("Failed to load appointments");
      toast.error("Failed to load calendar appointments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [currentDate]);

  const goToPreviousMonth = () => {
    setCurrentDate(prev => subMonths(prev, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(prev => addMonths(prev, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getAppointmentsForDate = (date) => {
    return appointments.filter(appointment => 
      isSameDay(new Date(appointment.scheduledDateTime), date)
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rescheduled':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'no_show':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  if (loading) return <Loading />;
  if (error) return <Error message={error} onRetry={loadAppointments} />;

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
              className="flex items-center"
            >
              <ApperIcon name="Calendar" size={14} className="mr-1" />
              Today
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousMonth}
            >
              <ApperIcon name="ChevronLeft" size={16} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextMonth}
            >
              <ApperIcon name="ChevronRight" size={16} />
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Day Headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}

          {/* Calendar Days */}
          {calendarDays.map(date => {
            const dayAppointments = getAppointmentsForDate(date);
            const isSelected = selectedDate && isSameDay(date, selectedDate);
            const isTodayDate = isToday(date);

            return (
              <button
                key={date.toISOString()}
                onClick={() => onDateSelect && onDateSelect(date)}
                className={`min-h-24 p-2 border border-gray-200 hover:bg-gray-50 transition-colors ${
                  isSelected ? 'bg-primary-50 border-primary-200' : ''
                } ${
                  isTodayDate ? 'bg-blue-50 border-blue-200' : ''
                }`}
              >
                <div className="flex flex-col h-full">
                  <span className={`text-sm ${
                    isTodayDate ? 'font-bold text-blue-600' : 'text-gray-900'
                  }`}>
                    {format(date, 'd')}
                  </span>
                  
                  {dayAppointments.length > 0 && (
                    <div className="flex-1 mt-1 space-y-1">
                      {dayAppointments.slice(0, 2).map(appointment => (
                        <div
                          key={appointment.Id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onAppointmentClick && onAppointmentClick(appointment);
                          }}
                          className={`px-1 py-0.5 rounded text-xs border truncate ${getStatusColor(appointment.status)}`}
                          title={`${appointment.title} - ${format(new Date(appointment.scheduledDateTime), 'h:mm a')}`}
                        >
                          {format(new Date(appointment.scheduledDateTime), 'h:mm a')}
                        </div>
                      ))}
                      {dayAppointments.length > 2 && (
                        <div className="text-xs text-gray-500 px-1">
                          +{dayAppointments.length - 2} more
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Appointment Legend */}
      <Card className="p-4">
        <h3 className="font-medium text-gray-900 mb-3 flex items-center">
          <ApperIcon name="Info" size={16} className="mr-2" />
          Appointment Status Legend
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {appointmentsService.getStatusOptions().map(status => (
            <div key={status.value} className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded border ${getStatusColor(status.value)}`}></div>
              <span className="text-sm text-gray-700">{status.label}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default CalendarView;