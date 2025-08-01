import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { toast } from "react-toastify";
import appointmentsService from "@/services/api/appointmentsService";
import AppointmentScheduleModal from "@/components/organisms/AppointmentScheduleModal";
import leadsService from "@/services/api/leadsService";
import ApperIcon from "@/components/ApperIcon";
import StatusBadge from "@/components/molecules/StatusBadge";
import AddActivityModal from "@/components/organisms/AddActivityModal";
import Loading from "@/components/ui/Loading";
import Input from "@/components/atoms/Input";
import Button from "@/components/atoms/Button";
import Label from "@/components/atoms/Label";
import { Card } from "@/components/atoms/Card";

const LeadDetailModal = ({ isOpen, onClose, lead, onLeadUpdate }) => {
  const [activeTab, setActiveTab] = useState("details");
  const [newNote, setNewNote] = useState("");
  const [editingNote, setEditingNote] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [appointments, setAppointments] = useState([]);
const [appointmentsLoading, setAppointmentsLoading] = useState(false);

  const loadAppointments = async () => {
    if (!lead?.Id) return;
    try {
      setAppointmentsLoading(true);
      const data = await appointmentsService.getByLeadId(lead.Id);
      setAppointments(data);
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setAppointmentsLoading(false);
    }
  };
  useEffect(() => {
    if (isOpen && lead?.Id) {
      loadAppointments();
    }
  }, [isOpen, lead?.Id]);

  if (!isOpen || !lead) return null;

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setLoading(true);
    try {
      const updatedLead = await leadsService.addNote(lead.Id, {
        content: newNote.trim()
      });
      onLeadUpdate(updatedLead);
      setNewNote("");
      toast.success("Note added successfully!");
    } catch (err) {
      toast.error("Failed to add note.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditNote = (note) => {
    setEditingNote(note.id);
    setEditContent(note.content);
  };

  const handleUpdateNote = async (e) => {
    e.preventDefault();
    if (!editContent.trim()) return;

    setLoading(true);
    try {
      const updatedLead = await leadsService.updateNote(lead.Id, editingNote, {
        content: editContent.trim()
      });
      onLeadUpdate(updatedLead);
      setEditingNote(null);
      setEditContent("");
      toast.success("Note updated successfully!");
    } catch (err) {
      toast.error("Failed to update note.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm("Are you sure you want to delete this note?")) return;

    setLoading(true);
    try {
      const updatedLead = await leadsService.deleteNote(lead.Id, noteId);
      onLeadUpdate(updatedLead);
      toast.success("Note deleted successfully!");
    } catch (err) {
      toast.error("Failed to delete note.");
    } finally {
      setLoading(false);
    }
  };

const cancelEdit = () => {
    setEditingNote(null);
    setEditContent("");
  };

  const handleActivityAdd = async (leadId, activityData) => {
    try {
      const updatedLead = await leadsService.addActivity(leadId, activityData);
      onLeadUpdate(updatedLead);
      return updatedLead;
    } catch (error) {
      throw error;
    }
  };

  const formatDate = (dateString) => {
    return format(new Date(dateString), "MMM dd, yyyy 'at' h:mm a");
  };

  const tabs = [
    { id: "details", label: "Lead Details", icon: "User" },
    { id: "history", label: "Contact History", icon: "Clock" },
    { id: "appointments", label: "Appointments", icon: "Calendar" },
    { id: "notes", label: "Notes", icon: "FileText" }
  ];

  const handleAppointmentAdd = async (leadId, appointmentData) => {
    try {
      await loadAppointments();
      return appointmentData;
    } catch (error) {
      throw error;
    }
  };

  const handleAppointmentUpdate = async (appointmentId, status) => {
    try {
      await appointmentsService.updateStatus(appointmentId, status);
      await loadAppointments();
      toast.success(`Appointment ${status} successfully!`);
    } catch (error) {
      toast.error("Failed to update appointment");
    }
  };

  const handleAppointmentDelete = async (appointmentId) => {
    if (!window.confirm("Are you sure you want to delete this appointment?")) return;
    
    try {
      await appointmentsService.delete(appointmentId);
      await loadAppointments();
      toast.success("Appointment deleted successfully!");
    } catch (error) {
      toast.error("Failed to delete appointment");
    }
  };

  const getAppointmentStatusColor = (status) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'rescheduled':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAppointmentIcon = (type) => {
    switch (type) {
      case 'presentation':
        return 'Presentation';
      case 'follow_up':
        return 'Phone';
      case 'meeting':
        return 'Users';
      case 'consultation':
        return 'MessageCircle';
      case 'training':
        return 'BookOpen';
      case 'closing':
        return 'Handshake';
      default:
        return 'Calendar';
    }
  };
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              <ApperIcon name="User" size={24} className="text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{lead.name}</h2>
              <div className="flex items-center space-x-2 mt-1">
                <StatusBadge status={lead.status} />
                <span className="text-sm text-gray-500">
                  Added {formatDate(lead.dateAdded)}
                </span>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <ApperIcon name="X" size={20} />
          </Button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <ApperIcon name={tab.icon} size={16} />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {activeTab === "details" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-4">
                  <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                    <ApperIcon name="Phone" size={16} className="mr-2 text-gray-600" />
                    Contact Information
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm text-gray-600">Phone</Label>
                      <p className="text-gray-900">{lead.phone}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">Email</Label>
                      <p className="text-gray-900">{lead.email}</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                    <ApperIcon name="Calendar" size={16} className="mr-2 text-gray-600" />
                    Timeline
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm text-gray-600">Date Added</Label>
                      <p className="text-gray-900">{formatDate(lead.dateAdded)}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">Last Contacted</Label>
                      <p className="text-gray-900">{formatDate(lead.lastContacted)}</p>
                    </div>
                  </div>
                </Card>
              </div>

              <Card className="p-4">
                <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                  <ApperIcon name="Activity" size={16} className="mr-2 text-gray-600" />
                  Lead Status
                </h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Current Status</p>
                    <StatusBadge status={lead.status} className="mt-1" />
                  </div>
                </div>
              </Card>
            </div>
          )}

{activeTab === "history" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900 flex items-center">
                  <ApperIcon name="Clock" size={16} className="mr-2" />
                  Contact History Timeline
                </h3>
                <Button
                  size="sm"
                  onClick={() => setIsActivityModalOpen(true)}
                  className="flex items-center"
                >
                  <ApperIcon name="Plus" size={14} className="mr-1" />
                  Log Activity
                </Button>
              </div>
              {lead.contactHistory && lead.contactHistory.length > 0 ? (
                <div className="space-y-4">
                  {lead.contactHistory.map((contact, index) => (
<div key={index} className="flex items-start space-x-4 pb-4 border-b border-gray-100 last:border-b-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        contact.outcome === 'positive' ? 'bg-green-100' : 
                        contact.outcome === 'negative' ? 'bg-red-100' : 'bg-primary-100'
                      }`}>
                        <ApperIcon 
                          name={
                            contact.type === 'call' ? 'Phone' : 
                            contact.type === 'email' ? 'Mail' : 
                            contact.type === 'text' ? 'MessageSquare' :
                            contact.type === 'meeting' ? 'Users' :
                            contact.type === 'social' ? 'Share2' :
                            contact.type === 'referral' ? 'UserPlus' :
                            contact.type === 'presentation' ? 'Presentation' :
                            contact.type === 'enrollment' ? 'CheckCircle' :
                            'MessageSquare'
                          } 
                          size={14} 
                          className={
                            contact.outcome === 'positive' ? 'text-green-600' : 
                            contact.outcome === 'negative' ? 'text-red-600' : 'text-primary-600'
                          } 
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-900 capitalize">
                            {contact.type} {contact.action}
                          </h4>
                          <span className="text-xs text-gray-500">{formatDate(contact.date)}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{contact.description}</p>
                        {contact.outcome && (
                          <span className={`inline-block mt-2 px-2 py-1 text-xs rounded-full ${
                            contact.outcome === 'positive' 
                              ? 'bg-green-100 text-green-800' 
                              : contact.outcome === 'negative'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {contact.outcome}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <ApperIcon name="Clock" size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">No contact history available</p>
                </div>
              )}
            </div>
)}

          {activeTab === "appointments" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900 flex items-center">
                  <ApperIcon name="Calendar" size={16} className="mr-2" />
                  Scheduled Appointments
                </h3>
                <Button
                  size="sm"
                  onClick={() => setIsAppointmentModalOpen(true)}
                  className="flex items-center"
                >
                  <ApperIcon name="Plus" size={14} className="mr-1" />
                  Schedule Appointment
                </Button>
              </div>

              {appointmentsLoading ? (
                <div className="text-center py-8">
                  <ApperIcon name="Loader2" size={24} className="mx-auto text-gray-400 animate-spin mb-2" />
                  <p className="text-gray-500">Loading appointments...</p>
                </div>
              ) : appointments.length > 0 ? (
                <div className="space-y-4">
                  {appointments.map((appointment) => (
                    <Card key={appointment.Id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <ApperIcon 
                              name={getAppointmentIcon(appointment.type)} 
                              size={18} 
                              className="text-primary-600" 
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="font-medium text-gray-900">{appointment.title}</h4>
                              <span className={`px-2 py-1 text-xs rounded-full ${getAppointmentStatusColor(appointment.status)}`}>
                                {appointment.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              {format(new Date(appointment.scheduledDateTime), "MMM dd, yyyy 'at' h:mm a")} 
                              • {appointment.duration} minutes
                            </p>
                            {appointment.location && (
                              <p className="text-sm text-gray-500 mb-2 flex items-center">
                                <ApperIcon name="MapPin" size={14} className="mr-1" />
                                {appointment.location}
                              </p>
                            )}
                            {appointment.description && (
                              <p className="text-sm text-gray-600">{appointment.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          {appointment.status === 'scheduled' && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleAppointmentUpdate(appointment.Id, 'confirmed')}
                                className="text-green-600 hover:text-green-700"
                                title="Confirm appointment"
                              >
                                <ApperIcon name="Check" size={14} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleAppointmentUpdate(appointment.Id, 'cancelled')}
                                className="text-red-600 hover:text-red-700"
                                title="Cancel appointment"
                              >
                                <ApperIcon name="X" size={14} />
                              </Button>
                            </>
                          )}
                          {appointment.status === 'confirmed' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAppointmentUpdate(appointment.Id, 'completed')}
                              className="text-green-600 hover:text-green-700"
                              title="Mark as completed"
                            >
                              <ApperIcon name="CheckCircle" size={14} />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAppointmentDelete(appointment.Id)}
                            className="text-gray-400 hover:text-red-600"
                            title="Delete appointment"
                          >
                            <ApperIcon name="Trash2" size={14} />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <ApperIcon name="Calendar" size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">No appointments scheduled</p>
                  <p className="text-sm text-gray-400 mt-1">Schedule your first appointment with this lead</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "notes" && (
            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-4 flex items-center">
                  <ApperIcon name="FileText" size={16} className="mr-2" />
                  Lead Notes
                </h3>
                
                {/* Add Note Form */}
                <Card className="p-4 mb-6">
                  <form onSubmit={handleAddNote}>
                    <Label htmlFor="newNote" className="text-sm font-medium text-gray-700 mb-2 block">
                      Add New Note
                    </Label>
                    <textarea
                      id="newNote"
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Enter your note about this lead..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                      rows={3}
                      disabled={loading}
                    />
                    <div className="flex justify-end mt-3">
                      <Button
                        type="submit"
                        disabled={!newNote.trim() || loading}
                        size="sm"
                      >
                        {loading ? (
                          <>
                            <ApperIcon name="Loader2" size={14} className="mr-2 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          <>
                            <ApperIcon name="Plus" size={14} className="mr-2" />
                            Add Note
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Card>

                {/* Notes List */}
                <div className="space-y-4">
                  {lead.notes && lead.notes.length > 0 ? (
                    lead.notes.map((note) => (
                      <Card key={note.id} className="p-4">
                        {editingNote === note.id ? (
                          <form onSubmit={handleUpdateNote} className="space-y-3">
                            <textarea
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                              rows={3}
                              disabled={loading}
                            />
                            <div className="flex justify-end space-x-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={cancelEdit}
                                disabled={loading}
                              >
                                Cancel
                              </Button>
                              <Button
                                type="submit"
                                size="sm"
                                disabled={!editContent.trim() || loading}
                              >
                                {loading ? "Saving..." : "Save"}
                              </Button>
                            </div>
                          </form>
                        ) : (
                          <>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="text-gray-900 whitespace-pre-wrap">{note.content}</p>
                                <div className="flex items-center space-x-4 mt-3 text-xs text-gray-500">
                                  <span>Created {formatDate(note.createdAt)}</span>
                                  {note.updatedAt !== note.createdAt && (
                                    <span>• Updated {formatDate(note.updatedAt)}</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center space-x-1 ml-4">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditNote(note)}
                                  className="text-gray-400 hover:text-gray-600"
                                  disabled={loading}
                                >
                                  <ApperIcon name="Edit" size={14} />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteNote(note.id)}
                                  className="text-gray-400 hover:text-red-600"
                                  disabled={loading}
                                >
                                  <ApperIcon name="Trash2" size={14} />
                                </Button>
                              </div>
                            </div>
                          </>
                        )}
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <ApperIcon name="FileText" size={48} className="mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-500">No notes added yet</p>
                      <p className="text-sm text-gray-400 mt-1">Add your first note to track interactions with this lead</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
<AddActivityModal
        isOpen={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
        lead={lead}
        onActivityAdd={handleActivityAdd}
      />

      <AppointmentScheduleModal
        isOpen={isAppointmentModalOpen}
        onClose={() => setIsAppointmentModalOpen(false)}
        lead={lead}
        onAppointmentAdd={handleAppointmentAdd}
      />
    </div>
  );
};

export default LeadDetailModal;