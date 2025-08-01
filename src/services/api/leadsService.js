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