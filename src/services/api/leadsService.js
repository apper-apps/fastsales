import leadsData from "@/services/mockData/leads.json";
class LeadsService {
  constructor() {
    this.leads = [...leadsData];
  }

  async getAll() {
    await new Promise(resolve => setTimeout(resolve, 200));
    return [...this.leads];
  }

async getById(id) {
    await new Promise(resolve => setTimeout(resolve, 200));
    const lead = this.leads.find(lead => lead.Id === parseInt(id));
    if (!lead) {
      throw new Error("Lead not found");
    }
    return { 
      ...lead,
      contactHistory: lead.contactHistory || [],
      notes: lead.notes || []
    };
  }

  async addNote(leadId, noteData) {
    await new Promise(resolve => setTimeout(resolve, 300));
    const leadIndex = this.leads.findIndex(lead => lead.Id === parseInt(leadId));
    if (leadIndex === -1) {
      throw new Error("Lead not found");
    }

    const newNote = {
      id: Date.now(),
      content: noteData.content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (!this.leads[leadIndex].notes) {
      this.leads[leadIndex].notes = [];
    }
    
    this.leads[leadIndex].notes.unshift(newNote);
    return { ...this.leads[leadIndex] };
  }

  async updateNote(leadId, noteId, noteData) {
    await new Promise(resolve => setTimeout(resolve, 300));
    const leadIndex = this.leads.findIndex(lead => lead.Id === parseInt(leadId));
    if (leadIndex === -1) {
      throw new Error("Lead not found");
    }

    const lead = this.leads[leadIndex];
    if (!lead.notes) {
      throw new Error("Note not found");
    }

    const noteIndex = lead.notes.findIndex(note => note.id === noteId);
    if (noteIndex === -1) {
      throw new Error("Note not found");
    }

    lead.notes[noteIndex] = {
      ...lead.notes[noteIndex],
      content: noteData.content,
      updatedAt: new Date().toISOString()
    };

    return { ...lead };
  }

  async deleteNote(leadId, noteId) {
    await new Promise(resolve => setTimeout(resolve, 300));
    const leadIndex = this.leads.findIndex(lead => lead.Id === parseInt(leadId));
    if (leadIndex === -1) {
      throw new Error("Lead not found");
    }

    const lead = this.leads[leadIndex];
    if (!lead.notes) {
      throw new Error("Note not found");
    }

    lead.notes = lead.notes.filter(note => note.id !== noteId);
    return { ...lead };
  }

  async create(leadData) {
    await new Promise(resolve => setTimeout(resolve, 300));
    const maxId = Math.max(...this.leads.map(lead => lead.Id), 0);
    const newLead = {
      Id: maxId + 1,
      ...leadData,
      dateAdded: new Date().toISOString(),
      lastContacted: new Date().toISOString()
    };
    this.leads.unshift(newLead);
    return { ...newLead };
  }

  async update(id, updateData) {
    await new Promise(resolve => setTimeout(resolve, 300));
    const index = this.leads.findIndex(lead => lead.Id === parseInt(id));
    if (index === -1) {
      throw new Error("Lead not found");
    }
    this.leads[index] = {
      ...this.leads[index],
      ...updateData,
      lastContacted: new Date().toISOString()
    };
    return { ...this.leads[index] };
  }

  async delete(id) {
    await new Promise(resolve => setTimeout(resolve, 300));
    const index = this.leads.findIndex(lead => lead.Id === parseInt(id));
    if (index === -1) {
      throw new Error("Lead not found");
    }
    this.leads.splice(index, 1);
return true;
  }

  async updateStage(id, newStatus) {
    await new Promise(resolve => setTimeout(resolve, 300));
    const index = this.leads.findIndex(lead => lead.Id === parseInt(id));
    if (index === -1) {
      throw new Error("Lead not found");
    }
    
    const oldStatus = this.leads[index].status;
    this.leads[index] = {
      ...this.leads[index],
      status: newStatus,
      lastContacted: new Date().toISOString()
    };

    // Add stage transition to contact history
    const transitionRecord = {
      type: "stage_change",
      action: "moved",
      date: new Date().toISOString(),
      description: `Moved from "${oldStatus}" to "${newStatus}"`,
      outcome: "neutral"
    };

    if (!this.leads[index].contactHistory) {
      this.leads[index].contactHistory = [];
    }
    this.leads[index].contactHistory.unshift(transitionRecord);

    return { ...this.leads[index] };
  }
async addActivity(leadId, activityData) {
    await new Promise(resolve => setTimeout(resolve, 300));
    const leadIndex = this.leads.findIndex(lead => lead.Id === parseInt(leadId));
    if (leadIndex === -1) {
      throw new Error("Lead not found");
    }

    const lead = this.leads[leadIndex];

    // Ensure contactHistory array exists
    if (!lead.contactHistory) {
      lead.contactHistory = [];
    }

    // Add the new activity
    const newActivity = {
      ...activityData,
      date: activityData.date || new Date().toISOString()
    };

    lead.contactHistory.push(newActivity);
    lead.lastContacted = newActivity.date;

    // Auto-update status based on activity outcome and current status
    if (activityData.outcome === "positive") {
      const statusProgression = {
        "New Leads": "Initial Contact",
        "Initial Contact": "Presentation Scheduled",
        "Presentation Scheduled": "Presented",
        "Presented": "Follow-up",
        "Follow-up": "Closed Won"
      };
      
      if (statusProgression[lead.status]) {
        lead.status = statusProgression[lead.status];
      }
    } else if (activityData.outcome === "negative") {
      // Move to Closed Lost if negative outcome
      if (lead.status !== "Closed Won" && lead.status !== "Closed Lost") {
        lead.status = "Closed Lost";
      }
    }

    // If enrollment activity, mark as Closed Won
    if (activityData.type === "enrollment" && activityData.action === "completed") {
      lead.status = "Closed Won";
      lead.closedDate = newActivity.date;
      // Set a reasonable contract value if not exists
      if (!lead.contractValue) {
        lead.contractValue = 1500;
      }
    }

    // Sort contact history by date (newest first)
    lead.contactHistory.sort((a, b) => new Date(b.date) - new Date(a.date));

    return { ...this.leads[leadIndex] };
  }
async addAppointment(leadId, appointmentData) {
    const lead = await this.getById(leadId);
    if (!lead.appointments) {
      lead.appointments = [];
    }

    const appointment = {
      id: Date.now(),
      ...appointmentData,
      createdAt: new Date().toISOString()
    };

    lead.appointments.push(appointment);
    const updatedLead = await this.update(leadId, { appointments: lead.appointments });
    return updatedLead;
  }
}

export default new LeadsService();