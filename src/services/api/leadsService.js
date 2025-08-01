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
}

export default new LeadsService();