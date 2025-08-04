class ReminderService {
  calculateFollowUpReminders(leads) {
    const reminders = [];
    const now = new Date();

    leads.forEach(lead => {
      const reminder = this.analyzeLeadForReminder(lead, now);
      if (reminder) {
        reminders.push(reminder);
      }
    });

    // Sort by priority (urgent first) then by days overdue
    return reminders.sort((a, b) => {
      if (a.priority !== b.priority) {
        return this.getPriorityScore(b.priority) - this.getPriorityScore(a.priority);
      }
      return b.daysOverdue - a.daysOverdue;
    });
  }

  analyzeLeadForReminder(lead, currentDate) {
    const lastInteraction = this.getLastInteractionDate(lead);
    const daysSinceLastInteraction = this.calculateDaysAgo(lastInteraction, currentDate);
    const expectedFollowUpDays = this.getExpectedFollowUpDays(lead.status);
    const daysOverdue = daysSinceLastInteraction - expectedFollowUpDays;

    // Only create reminder if follow-up is due or overdue
    if (daysOverdue < 0) return null;

    const priority = this.calculatePriority(lead, daysOverdue, daysSinceLastInteraction);
    const suggestedAction = this.getSuggestedAction(lead, daysOverdue);
    const timing = this.getTimingMessage(daysOverdue, expectedFollowUpDays);

    return {
      Id: lead.Id,
      leadName: lead.name,
      leadEmail: lead.email,
      leadPhone: lead.phone,
      status: lead.status,
      lastInteraction,
      daysSinceLastInteraction,
      daysOverdue,
      priority,
      suggestedAction,
      timing,
      estimatedValue: lead.estimatedValue || 0,
      source: lead.source
    };
  }

  getLastInteractionDate(lead) {
    const dates = [];
    
    // Check activities
    if (lead.activities && lead.activities.length > 0) {
      const lastActivity = lead.activities
        .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
      dates.push(new Date(lastActivity.date));
    }

    // Check appointments
    if (lead.appointments && lead.appointments.length > 0) {
      const lastAppointment = lead.appointments
        .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
      dates.push(new Date(lastAppointment.date));
    }

    // Check notes
    if (lead.notes && lead.notes.length > 0) {
      const lastNote = lead.notes
        .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
      dates.push(new Date(lastNote.date));
    }

    // Fall back to created date if no interactions
    if (dates.length === 0) {
      return new Date(lead.dateAdded);
    }

    // Return most recent interaction
    return new Date(Math.max(...dates));
  }

  calculateDaysAgo(date, currentDate) {
    const diffTime = currentDate - date;
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  getExpectedFollowUpDays(status) {
    const followUpSchedule = {
      'New Leads': 1,
      'Initial Contact': 3,
      'Presentation Scheduled': 2,
      'Proposal Sent': 5,
      'Negotiation': 2,
      'Closed Won': 30, // Customer check-in
      'Closed Lost': 90  // Re-engagement attempt
    };
    return followUpSchedule[status] || 7;
  }

  calculatePriority(lead, daysOverdue, daysSinceLastInteraction) {
    const estimatedValue = lead.estimatedValue || 0;
    
    // High value leads get higher priority
    if (estimatedValue > 50000 && daysOverdue > 0) return 'urgent';
    if (daysOverdue > 7) return 'urgent';
    if (daysOverdue > 3 && estimatedValue > 25000) return 'high';
    if (daysOverdue > 0) return 'medium';
    if (daysSinceLastInteraction > 14) return 'low';
    
    return 'medium';
  }

getSuggestedAction(lead, daysOverdue) {
    // Check for recent objections in activities to provide more targeted follow-up
    const recentObjection = this.getLastObjection(lead);
    
    if (recentObjection) {
      const objectionActions = {
        price: 'Send ROI calculator and value proposition materials',
        time: 'Check in on timing - circumstances may have changed',
        skepticism: 'Share additional case studies and success stories',
        need: 'Provide industry insights about emerging challenges',
        authority: 'Schedule group presentation with decision makers',
        trust: 'Send testimonials and offer reference calls',
        competition: 'Present competitive advantage analysis',
        timing: 'Follow up on timing constraints and offer flexible options'
      };
      
      if (objectionActions[recentObjection.type]) {
        return objectionActions[recentObjection.type];
      }
    }

    // Default status-based actions
    if (lead.status === 'New Leads') {
      return daysOverdue > 2 ? 'Call immediately' : 'Make initial contact';
    }
    if (lead.status === 'Initial Contact') {
      return 'Schedule presentation';
    }
    if (lead.status === 'Presentation Scheduled') {
      return 'Confirm upcoming presentation';
    }
    if (lead.status === 'Proposal Sent') {
      return daysOverdue > 3 ? 'Follow up on proposal' : 'Check for questions';
    }
    if (lead.status === 'Negotiation') {
      return 'Continue negotiation';
    }
    if (lead.status === 'Closed Won') {
      return 'Customer check-in call';
    }
    if (lead.status === 'Closed Lost') {
      return 'Re-engagement attempt';
    }
    return 'Follow up with lead';
  }

  getLastObjection(lead) {
    if (!lead.activities || lead.activities.length === 0) return null;
    
    // Find the most recent activity with an objection
    const activitiesWithObjections = lead.activities
      .filter(activity => activity.objection && activity.objection.type)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    return activitiesWithObjections.length > 0 ? activitiesWithObjections[0].objection : null;
  }

  getTimingMessage(daysOverdue, expectedDays) {
    if (daysOverdue === 0) {
      return 'Due today';
    } else if (daysOverdue === 1) {
      return '1 day overdue';
    } else if (daysOverdue > 1) {
      return `${daysOverdue} days overdue`;
    } else {
      return `Due in ${Math.abs(daysOverdue)} days`;
    }
  }

  getPriorityScore(priority) {
    const scores = {
      'urgent': 4,
      'high': 3,
      'medium': 2,
      'low': 1
    };
    return scores[priority] || 2;
  }

  getPriorityColor(priority) {
    const colors = {
      'urgent': 'bg-red-500',
      'high': 'bg-orange-500', 
      'medium': 'bg-yellow-500',
      'low': 'bg-green-500'
    };
    return colors[priority] || 'bg-gray-500';
  }

  getPriorityTextColor(priority) {
    const colors = {
      'urgent': 'text-red-700',
      'high': 'text-orange-700',
      'medium': 'text-yellow-700', 
      'low': 'text-green-700'
    };
    return colors[priority] || 'text-gray-700';
  }

  // Reminder action methods
  async markReminderComplete(reminderId) {
    // In a real app, this would update backend
    return Promise.resolve(true);
  }

  async snoozeReminder(reminderId, days = 3) {
    // In a real app, this would update backend
    return Promise.resolve(true);
  }
}

const reminderService = new ReminderService();
export default reminderService;