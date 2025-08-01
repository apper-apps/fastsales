import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/Card";
import StatusBadge from "@/components/molecules/StatusBadge";
import ApperIcon from "@/components/ApperIcon";

const PipelineView = ({ leads }) => {
  const stages = [
    { name: "New", status: "New", color: "bg-blue-500", icon: "UserPlus" },
    { name: "Contacted", status: "Contacted", color: "bg-yellow-500", icon: "Phone" },
    { name: "Interested", status: "Interested", color: "bg-green-500", icon: "Heart" },
    { name: "Not Interested", status: "Not Interested", color: "bg-red-500", icon: "X" },
  ];

  const getLeadsByStatus = (status) => {
    return leads.filter(lead => lead.status === status);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stages.map((stage) => {
        const stageLeads = getLeadsByStatus(stage.status);
        return (
          <Card key={stage.name} className="h-fit">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-lg">
                <div className="flex items-center">
                  <div className={`p-2 ${stage.color} rounded-lg mr-3`}>
                    <ApperIcon name={stage.icon} className="h-4 w-4 text-white" />
                  </div>
                  {stage.name}
                </div>
                <span className="text-sm font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                  {stageLeads.length}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {stageLeads.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No leads in this stage
                </p>
              ) : (
                stageLeads.map((lead) => (
                  <div
                    key={lead.Id}
                    className="p-3 bg-gray-50/50 rounded-lg border border-gray-100 hover:bg-gray-100/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 text-sm">
                          {lead.name}
                        </h4>
                        <p className="text-xs text-gray-600 mt-1">
                          {lead.phone}
                        </p>
                        <p className="text-xs text-gray-600">
                          {lead.email}
                        </p>
                      </div>
                      <StatusBadge status={lead.status} />
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      Added {new Date(lead.dateAdded).toLocaleDateString()}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default PipelineView;