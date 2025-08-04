import React, { useEffect, useState } from "react";
import leadsService from "@/services/api/leadsService";
import reminderService from "@/services/reminderService";
import ApperIcon from "@/components/ApperIcon";
import MetricCard from "@/components/molecules/MetricCard";
import Loading from "@/components/ui/Loading";
import Error from "@/components/ui/Error";
import Pipeline from "@/components/pages/Pipeline";
import Button from "@/components/atoms/Button";
import ReminderCard from "@/components/molecules/ReminderCard";

const Dashboard = () => {
const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reminders, setReminders] = useState([]);
const loadLeads = async () => {
    try {
      setLoading(true);
      setError("");
      await new Promise(resolve => setTimeout(resolve, 300));
      const data = await leadsService.getAll();
      setLeads(data);
      
      // Calculate reminders based on lead data
      const calculatedReminders = reminderService.calculateFollowUpReminders(data);
      setReminders(calculatedReminders);
    } catch (err) {
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReminderAction = async (action, leadId) => {
    // Refresh reminders after any action
    if (action === 'complete' || action === 'snooze') {
      const updatedReminders = reminders.filter(r => r.Id !== leadId);
      setReminders(updatedReminders);
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

      {/* Follow-up Reminders Section */}
      {reminders.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-100 rounded-lg">
              <ApperIcon name="Bell" size={20} className="text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-gray-900">
                Follow-up Reminders
              </h2>
              <p className="text-sm text-gray-600">
                {reminders.length} leads need your attention
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {reminders.slice(0, 6).map((reminder) => (
              <ReminderCard
                key={reminder.Id}
                reminder={reminder}
                onAction={handleReminderAction}
              />
            ))}
          </div>
          
          {reminders.length > 6 && (
            <div className="mt-4 text-center">
              <Button variant="outline" size="sm">
                <ApperIcon name="MoreHorizontal" size={16} className="mr-2" />
                View {reminders.length - 6} more reminders
              </Button>
            </div>
          )}
        </div>
      )}

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