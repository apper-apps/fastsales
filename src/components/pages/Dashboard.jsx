import React, { useState, useEffect } from "react";
import MetricCard from "@/components/molecules/MetricCard";
import Loading from "@/components/ui/Loading";
import Error from "@/components/ui/Error";
import leadsService from "@/services/api/leadsService";

const Dashboard = () => {
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
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, []);

  if (loading) return <Loading />;
  if (error) return <Error message={error} onRetry={loadLeads} />;

  const metrics = {
    totalLeads: leads.length,
    activeProspects: leads.filter(lead => lead.status === "Interested").length,
    appointmentsScheduled: leads.filter(lead => lead.status === "Contacted").length,
    newLeads: leads.filter(lead => lead.status === "New").length,
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">
          Sales Dashboard
        </h1>
        <p className="text-gray-600">
          Track your network marketing performance and manage your sales pipeline
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Leads"
          value={metrics.totalLeads}
          icon="Users"
          trend="up"
          trendValue="+12% from last month"
        />
        <MetricCard
          title="Active Prospects"
          value={metrics.activeProspects}
          icon="Heart"
          trend="up"
          trendValue="+8% from last week"
        />
        <MetricCard
          title="Contacted"
          value={metrics.appointmentsScheduled}
          icon="Phone"
          trend="up"
          trendValue="+15% from last week"
        />
        <MetricCard
          title="New Leads"
          value={metrics.newLeads}
          icon="UserPlus"
          trend="up"
          trendValue="+5 this week"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white/70 backdrop-blur-sm rounded-lg p-6 shadow-lg border border-gray-100">
          <h3 className="text-lg font-display font-semibold text-gray-900 mb-4">
            Recent Activity
          </h3>
          <div className="space-y-4">
            {leads.slice(0, 5).map((lead) => (
              <div key={lead.Id} className="flex items-center space-x-4 p-3 bg-gray-50/50 rounded-lg">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {lead.name.charAt(0)}
                    </span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {lead.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    Status: {lead.status}
                  </p>
                </div>
                <div className="text-sm text-gray-400">
                  {new Date(lead.dateAdded).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-sm rounded-lg p-6 shadow-lg border border-gray-100">
          <h3 className="text-lg font-display font-semibold text-gray-900 mb-4">
            Pipeline Overview
          </h3>
          <div className="space-y-4">
            {[
              { status: "New", count: metrics.newLeads, color: "bg-blue-500" },
              { status: "Contacted", count: metrics.appointmentsScheduled, color: "bg-yellow-500" },
              { status: "Interested", count: metrics.activeProspects, color: "bg-green-500" },
              { status: "Not Interested", count: leads.filter(l => l.status === "Not Interested").length, color: "bg-red-500" }
            ].map((stage) => (
              <div key={stage.status} className="flex items-center justify-between p-3 bg-gray-50/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${stage.color}`}></div>
                  <span className="text-sm font-medium text-gray-900">{stage.status}</span>
                </div>
                <span className="text-sm font-semibold text-gray-700">{stage.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;