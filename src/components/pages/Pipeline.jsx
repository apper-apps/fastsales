import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import PipelineView from "@/components/organisms/PipelineView";
import Loading from "@/components/ui/Loading";
import Error from "@/components/ui/Error";
import Empty from "@/components/ui/Empty";
import leadsService from "@/services/api/leadsService";

const Pipeline = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadLeads = async () => {
    try {
      setLoading(true);
      setError("");
      await new Promise(resolve => setTimeout(resolve, 300));
      const data = await leadsService.getAll();
      setLeads(data);
    } catch (err) {
      setError("Failed to load pipeline data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, []);

const handleStageChange = async (leadId, newStatus, leadName) => {
    try {
      await leadsService.updateStage(leadId, newStatus);
      await loadLeads(); // Refresh the leads data
      toast.success(`${leadName} moved to ${newStatus}`);
    } catch (error) {
      console.error('Error updating lead stage:', error);
      toast.error('Failed to update lead stage');
    }
  };

  if (loading) return <Loading />;
  if (error) return <Error message={error} onRetry={loadLeads} />;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">
          Sales Pipeline
        </h1>
        <p className="text-gray-600">
          Visualize your leads' progress through the sales funnel
        </p>
      </div>

      {leads.length === 0 ? (
        <Empty
          title="No pipeline data"
          description="Start by adding leads to see your sales pipeline visualization. Track how leads move through each stage of your sales process."
          icon="GitBranch"
        />
      ) : (
<PipelineView leads={leads} onStageChange={handleStageChange} />
      )}
    </div>
  );
};

export default Pipeline;