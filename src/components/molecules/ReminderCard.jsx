import React from 'react';
import { Card, CardContent } from '@/components/atoms/Card';
import Button from '@/components/atoms/Button';
import Badge from '@/components/atoms/Badge';
import ApperIcon from '@/components/ApperIcon';
import { toast } from 'react-toastify';
import reminderService from '@/services/api/reminderService';

function ReminderCard({ reminder, onAction }) {
  const handleCallNow = async () => {
    toast.success(`Calling ${reminder.leadName}...`);
    if (onAction) onAction('call', reminder.Id);
  };

  const handleScheduleFollowUp = async () => {
    toast.info(`Follow-up scheduled for ${reminder.leadName}`);
    if (onAction) onAction('schedule', reminder.Id);
  };

  const handleMarkComplete = async () => {
    try {
      await reminderService.markReminderComplete(reminder.Id);
      toast.success(`Reminder marked complete for ${reminder.leadName}`);
      if (onAction) onAction('complete', reminder.Id);
    } catch (error) {
      toast.error('Failed to mark reminder complete');
    }
  };

  const handleSnooze = async () => {
    try {
      await reminderService.snoozeReminder(reminder.Id);
      toast.info(`Reminder snoozed for 3 days for ${reminder.leadName}`);
      if (onAction) onAction('snooze', reminder.Id);
    } catch (error) {
      toast.error('Failed to snooze reminder');
    }
  };

  const priorityColor = reminderService.getPriorityColor(reminder.priority);
  const priorityTextColor = reminderService.getPriorityTextColor(reminder.priority);

  return (
    <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-gray-900">{reminder.leadName}</h4>
              <Badge 
                variant="outline" 
                className={`${priorityColor} text-white text-xs px-2 py-1`}
              >
                {reminder.priority.toUpperCase()}
              </Badge>
            </div>
            <p className="text-sm text-gray-600 mb-1">{reminder.suggestedAction}</p>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <ApperIcon name="Clock" size={12} />
                {reminder.timing}
              </span>
              <span className="flex items-center gap-1">
                <ApperIcon name="User" size={12} />
                {reminder.status}
              </span>
              {reminder.estimatedValue > 0 && (
                <span className="flex items-center gap-1">
                  <ApperIcon name="DollarSign" size={12} />
                  ${reminder.estimatedValue.toLocaleString()}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 ml-4">
            <Button
              size="sm"
              variant="outline"
              onClick={handleSnooze}
              className="p-1 h-8 w-8"
            >
              <ApperIcon name="Clock" size={14} />
            </Button>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleCallNow}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          >
            <ApperIcon name="Phone" size={14} className="mr-1" />
            Call Now
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleScheduleFollowUp}
            className="flex-1"
          >
            <ApperIcon name="Calendar" size={14} className="mr-1" />
            Schedule
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleMarkComplete}
            className="flex-1 border-green-500 text-green-600 hover:bg-green-50"
          >
            <ApperIcon name="Check" size={14} className="mr-1" />
            Complete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default ReminderCard;