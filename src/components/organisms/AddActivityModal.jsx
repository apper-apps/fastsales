import React, { useState } from "react";
import Button from "@/components/atoms/Button";
import { Card } from "@/components/atoms/Card";
import Input from "@/components/atoms/Input";
import Label from "@/components/atoms/Label";
import Select from "@/components/atoms/Select";
import FormField from "@/components/molecules/FormField";
import ApperIcon from "@/components/ApperIcon";
import { toast } from "react-toastify";

const AddActivityModal = ({ isOpen, onClose, lead, onActivityAdd }) => {
  const [activityData, setActivityData] = useState({
    type: "call",
    action: "completed",
    outcome: "neutral",
    description: "",
    date: new Date().toISOString().slice(0, 16)
  });
  const [loading, setLoading] = useState(false);

  const activityTypes = [
    { value: "call", label: "Phone Call", icon: "Phone" },
    { value: "email", label: "Email", icon: "Mail" },
    { value: "text", label: "Text Message", icon: "MessageSquare" },
    { value: "meeting", label: "In-Person Meeting", icon: "Users" },
    { value: "social", label: "Social Media", icon: "Share2" },
    { value: "referral", label: "Referral", icon: "UserPlus" },
    { value: "presentation", label: "Presentation", icon: "Presentation" },
    { value: "enrollment", label: "Enrollment", icon: "CheckCircle" }
  ];

  const actionTypes = [
    { value: "completed", label: "Completed" },
    { value: "attempted", label: "Attempted" },
    { value: "scheduled", label: "Scheduled" },
    { value: "sent", label: "Sent" },
    { value: "received", label: "Received" },
    { value: "connected", label: "Connected" }
  ];

  const outcomeTypes = [
    { value: "positive", label: "Positive - Moving Forward" },
    { value: "neutral", label: "Neutral - No Change" },
    { value: "negative", label: "Negative - Lost Interest" }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!activityData.description.trim()) {
      toast.error("Please add a description for this activity");
      return;
    }

    setLoading(true);
    try {
      const activityToAdd = {
        ...activityData,
        date: new Date(activityData.date).toISOString(),
        description: activityData.description.trim()
      };

      await onActivityAdd(lead.Id, activityToAdd);
      
      // Reset form
      setActivityData({
        type: "call",
        action: "completed",
        outcome: "neutral",
        description: "",
        date: new Date().toISOString().slice(0, 16)
      });
      
      onClose();
      toast.success("Activity logged successfully!");
    } catch (error) {
      toast.error("Failed to log activity. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const selectedActivityType = activityTypes.find(type => type.value === activityData.type);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                <ApperIcon name="Clock" size={20} className="text-primary-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Log Activity</h2>
                <p className="text-sm text-gray-600">{lead?.name}</p>
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
              label="Activity Type"
              type="select"
              value={activityData.type}
              onChange={(e) => setActivityData(prev => ({ ...prev, type: e.target.value }))}
              options={activityTypes}
              required
            />

            <FormField
              label="Action"
              type="select"
              value={activityData.action}
              onChange={(e) => setActivityData(prev => ({ ...prev, action: e.target.value }))}
              options={actionTypes}
              required
            />

            <FormField
              label="Date & Time"
              type="datetime-local"
              value={activityData.date}
              onChange={(e) => setActivityData(prev => ({ ...prev, date: e.target.value }))}
              required
            />

            <FormField
              label="Outcome"
              type="select"
              value={activityData.outcome}
              onChange={(e) => setActivityData(prev => ({ ...prev, outcome: e.target.value }))}
              options={outcomeTypes}
              required
            />

            <div className="space-y-2">
              <Label htmlFor="description">Description & Notes</Label>
              <textarea
                id="description"
                value={activityData.description}
                onChange={(e) => setActivityData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what happened during this contact..."
                className="w-full min-h-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-y"
                required
              />
            </div>

            {activityData.outcome === "positive" && (
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <div className="flex items-center">
                  <ApperIcon name="TrendingUp" size={16} className="text-green-600 mr-2" />
                  <p className="text-sm text-green-800">
                    Positive outcome will advance lead status if applicable
                  </p>
                </div>
              </div>
            )}

            {activityData.outcome === "negative" && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <div className="flex items-center">
                  <ApperIcon name="TrendingDown" size={16} className="text-red-600 mr-2" />
                  <p className="text-sm text-red-800">
                    Negative outcome may update lead status to reflect lost interest
                  </p>
                </div>
              </div>
            )}

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
                    Logging...
                  </>
                ) : (
                  <>
                    <ApperIcon name="Plus" size={16} className="mr-2" />
                    Log Activity
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

export default AddActivityModal;