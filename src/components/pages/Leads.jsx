import React, { useState, useEffect } from "react";
import Button from "@/components/atoms/Button";
import SearchBar from "@/components/molecules/SearchBar";
import LeadsTable from "@/components/organisms/LeadsTable";
import AddLeadModal from "@/components/organisms/AddLeadModal";
import Loading from "@/components/ui/Loading";
import Error from "@/components/ui/Error";
import Empty from "@/components/ui/Empty";
import ApperIcon from "@/components/ApperIcon";
import leadsService from "@/services/api/leadsService";
import { toast } from "react-toastify";

const Leads = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const loadLeads = async () => {
    try {
      setLoading(true);
      setError("");
      await new Promise(resolve => setTimeout(resolve, 300));
      const data = await leadsService.getAll();
      setLeads(data);
    } catch (err) {
      setError("Failed to load leads. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, []);

  const handleAddLead = async (leadData) => {
    try {
      const newLead = await leadsService.create(leadData);
      setLeads(prev => [newLead, ...prev]);
      toast.success("Lead added successfully!");
    } catch (err) {
      toast.error("Failed to add lead. Please try again.");
    }
  };

  const handleUpdateStatus = async (leadId, newStatus) => {
    try {
      const updatedLead = await leadsService.update(leadId, { status: newStatus });
      setLeads(prev => prev.map(lead => 
        lead.Id === leadId ? updatedLead : lead
      ));
      toast.success("Lead status updated!");
    } catch (err) {
      toast.error("Failed to update lead status.");
    }
  };

  const handleDeleteLead = async (leadId) => {
    if (window.confirm("Are you sure you want to delete this lead?")) {
      try {
        await leadsService.delete(leadId);
        setLeads(prev => prev.filter(lead => lead.Id !== leadId));
        toast.success("Lead deleted successfully!");
      } catch (err) {
        toast.error("Failed to delete lead.");
      }
    }
  };

  const filteredLeads = leads.filter(lead =>
    lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.phone.includes(searchTerm) ||
    lead.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <Loading />;
  if (error) return <Error message={error} onRetry={loadLeads} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">
            Leads Management
          </h1>
          <p className="text-gray-600">
            Manage your network marketing leads and track their progress
          </p>
        </div>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center"
        >
          <ApperIcon name="Plus" className="h-4 w-4 mr-2" />
          Add New Lead
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <SearchBar
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search leads by name, email, phone, or status..."
            className="w-full"
          />
        </div>
        <div className="text-sm text-gray-600 flex items-center">
          Showing {filteredLeads.length} of {leads.length} leads
        </div>
      </div>

      {filteredLeads.length === 0 ? (
        searchTerm ? (
          <Empty
            title="No leads found"
            description={`No leads match your search for "${searchTerm}". Try adjusting your search terms.`}
            icon="Search"
          />
        ) : (
          <Empty
            title="No leads yet"
            description="Start building your network by adding your first lead. Track their progress through your sales pipeline."
            actionLabel="Add First Lead"
            onAction={() => setIsAddModalOpen(true)}
            icon="Users"
          />
        )
      ) : (
        <LeadsTable
          leads={filteredLeads}
          onUpdateStatus={handleUpdateStatus}
          onDeleteLead={handleDeleteLead}
        />
      )}

      <AddLeadModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddLead}
      />
    </div>
  );
};

export default Leads;