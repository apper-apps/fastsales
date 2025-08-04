import leadsData from "@/services/mockData/leads.json";
class LeadsService {
constructor() {
    this.leads = [...leadsData];
    // Calculate initial AI scores for all leads
    this.leads = this.leads.map(lead => ({
      ...lead,
      aiScore: this.calculateAIScore(lead)
    }));
  }
async getAll() {
    await new Promise(resolve => setTimeout(resolve, 200));
    // Ensure all leads have updated AI scores
    const leadsWithScores = this.leads.map(lead => ({
      ...lead,
      aiScore: this.calculateAIScore(lead)
    }));
    return [...leadsWithScores];
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
    newLead.aiScore = this.calculateAIScore(newLead);
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
    this.leads[index].aiScore = this.calculateAIScore(this.leads[index]);
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
calculateAIScore(lead) {
    if (!lead) return 0;
    
    let score = 0;
    const now = new Date();
    const dateAdded = new Date(lead.dateAdded);
    const daysSinceAdded = Math.max(1, (now - dateAdded) / (1000 * 60 * 60 * 24));
    
    // Base score from lead status (0-30 points)
    const statusScores = {
      "New Leads": 10,
      "Initial Contact": 15,
      "Presentation Scheduled": 25,
      "Presented": 30,
      "Follow-up": 20,
      "Closed Won": 50,
      "Closed Lost": 5
    };
    score += statusScores[lead.status] || 10;
    
    // Contact history analysis (0-40 points)
    if (lead.contactHistory && lead.contactHistory.length > 0) {
      const interactions = lead.contactHistory;
      const positiveInteractions = interactions.filter(i => i.outcome === "positive").length;
      const totalInteractions = interactions.length;
      
      // Interaction frequency bonus (0-15 points)
      const interactionFrequency = Math.min(15, totalInteractions * 2);
      score += interactionFrequency;
      
      // Positive outcome ratio (0-20 points)
      const positiveRatio = totalInteractions > 0 ? positiveInteractions / totalInteractions : 0;
      score += Math.round(positiveRatio * 20);
      
      // Recent activity bonus (0-10 points)
      const lastContact = new Date(lead.lastContacted);
      const daysSinceContact = (now - lastContact) / (1000 * 60 * 60 * 24);
      if (daysSinceContact <= 3) score += 10;
      else if (daysSinceContact <= 7) score += 7;
      else if (daysSinceContact <= 14) score += 4;
      
      // Response time analysis (0-15 points)
      let responseTimeScore = 0;
      for (let i = 1; i < interactions.length; i++) {
        const current = new Date(interactions[i-1].date);
        const previous = new Date(interactions[i].date);
        const responseHours = (current - previous) / (1000 * 60 * 60);
        
        if (responseHours <= 24) responseTimeScore += 3;
        else if (responseHours <= 72) responseTimeScore += 2;
        else if (responseHours <= 168) responseTimeScore += 1;
      }
      score += Math.min(15, responseTimeScore);
    }
    
    // Engagement quality bonuses (0-20 points)
    if (lead.contactHistory) {
      const hasCall = lead.contactHistory.some(h => h.type === "call" && h.action === "completed");
      const hasMeeting = lead.contactHistory.some(h => h.type === "meeting");
      const hasPresentation = lead.contactHistory.some(h => h.type === "presentation");
      const hasEnrollment = lead.contactHistory.some(h => h.type === "enrollment");
      
      if (hasCall) score += 5;
      if (hasMeeting) score += 8;
      if (hasPresentation) score += 10;
      if (hasEnrollment) score += 15;
    }
    
    // Pipeline velocity bonus (0-10 points)
    const stageProgression = ["New Leads", "Initial Contact", "Presentation Scheduled", "Presented", "Follow-up"];
    const currentStageIndex = stageProgression.indexOf(lead.status);
    if (currentStageIndex > 0 && daysSinceAdded > 0) {
      const velocityScore = Math.min(10, (currentStageIndex / daysSinceAdded) * 30);
      score += velocityScore;
    }
    
    // Notes engagement bonus (0-5 points)
    if (lead.notes && lead.notes.length > 0) {
      score += Math.min(5, lead.notes.length);
    }
    
    // Cap the score and add randomization for realism
    score = Math.min(100, Math.max(1, Math.round(score)));
    
    // Add slight randomization to make scores feel more realistic
    const randomAdjustment = Math.floor(Math.random() * 6) - 3; // -3 to +3
    score = Math.min(100, Math.max(1, score + randomAdjustment));
    
    return score;
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
    
    // Recalculate AI score after status change
    this.leads[index].aiScore = this.calculateAIScore(this.leads[index]);

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
    
    // Recalculate AI score after activity addition
    this.leads[leadIndex].aiScore = this.calculateAIScore(this.leads[leadIndex]);

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

const leadsService = new LeadsService();
export default leadsService;
export default new LeadsService();