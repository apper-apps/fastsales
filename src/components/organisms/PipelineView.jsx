import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/Card";
import StatusBadge from "@/components/molecules/StatusBadge";
import ApperIcon from "@/components/ApperIcon";
import { toast } from "react-toastify";

const PipelineView = ({ leads, onStageChange }) => {
  const [draggedLead, setDraggedLead] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
const stages = [
    { 
      name: "New Leads", 
      status: "New Leads", 
      color: "bg-blue-500", 
      icon: "UserPlus",
      description: "Fresh leads to contact"
    },
    { 
      name: "Initial Contact", 
      status: "Initial Contact", 
      color: "bg-indigo-500", 
      icon: "Phone",
      description: "First contact made"
    },
    { 
      name: "Presentation Scheduled", 
      status: "Presentation Scheduled", 
      color: "bg-purple-500", 
      icon: "Calendar",
      description: "Demo scheduled"
    },
    { 
      name: "Presented", 
      status: "Presented", 
      color: "bg-orange-500", 
      icon: "PresentationChart",
      description: "Presentation completed"
    },
    { 
      name: "Follow-up", 
      status: "Follow-up", 
      color: "bg-yellow-500", 
      icon: "Clock",
      description: "Awaiting response"
    },
    { 
      name: "Closed Won", 
      status: "Closed Won", 
      color: "bg-green-500", 
      icon: "CheckCircle",
      description: "Successfully closed"
    },
    { 
      name: "Closed Lost", 
      status: "Closed Lost", 
      color: "bg-red-500", 
      icon: "XCircle",
      description: "Opportunity lost"
    }
  ];

const getLeadsByStatus = (status) => {
    return leads.filter(lead => lead.status === status);
  };

  const getTotalValue = (stageLeads) => {
    return stageLeads.reduce((sum, lead) => {
      return sum + (lead.contractValue || 0);
    }, 0);
  };

  const getConversionRate = (currentStage, previousStage) => {
    const currentCount = getLeadsByStatus(currentStage).length;
    const previousCount = getLeadsByStatus(previousStage).length;
    if (previousCount === 0) return 0;
    return Math.round((currentCount / (currentCount + previousCount)) * 100);
  };

  // Drag and Drop handlers
  const handleDragStart = (e, lead) => {
    setDraggedLead(lead);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.outerHTML);
    e.target.style.opacity = '0.6';
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedLead(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e, status) => {
    e.preventDefault();
    setDragOverColumn(status);
  };

  const handleDragLeave = (e) => {
    // Only clear drag over if we're leaving the column container
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = (e, newStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    
    if (draggedLead && draggedLead.status !== newStatus) {
      onStageChange(draggedLead.Id, newStatus, draggedLead.name);
    }
    setDraggedLead(null);
  };
return (
    <div className="space-y-6">
      {/* Pipeline Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {stages.map((stage) => {
          const stageLeads = getLeadsByStatus(stage.status);
          const totalValue = getTotalValue(stageLeads);
          
          return (
            <div key={stage.status} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 ${stage.color} rounded-lg`}>
                  <ApperIcon name={stage.icon} className="h-4 w-4 text-white" />
                </div>
                <span className="text-2xl font-bold text-gray-900">{stageLeads.length}</span>
              </div>
              <h3 className="text-sm font-medium text-gray-700 mb-1">{stage.name}</h3>
              {totalValue > 0 && (
                <p className="text-xs text-green-600 font-medium">
                  ${totalValue.toLocaleString()}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Kanban Board */}
      <div className="pipeline-columns grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7 gap-6 overflow-x-auto">
        {stages.map((stage) => {
          const stageLeads = getLeadsByStatus(stage.status);
          const isDragOver = dragOverColumn === stage.status;
          
          return (
            <div
              key={stage.status}
              className={`pipeline-column min-h-[500px] ${isDragOver ? 'drag-over' : ''}`}
              onDragOver={handleDragOver}
              onDragEnter={(e) => handleDragEnter(e, stage.status)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage.status)}
            >
              <Card className="h-full flex flex-col">
                <CardHeader className="pipeline-stage-header pb-3 flex-shrink-0">
                  <CardTitle className="flex items-center justify-between text-base">
                    <div className="flex items-center">
                      <div className={`p-2 ${stage.color} rounded-lg mr-3`}>
                        <ApperIcon name={stage.icon} className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold">{stage.name}</div>
                        <div className="text-xs text-gray-500 font-normal">{stage.description}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                        {stageLeads.length}
                      </span>
                      {getTotalValue(stageLeads) > 0 && (
                        <div className="text-xs text-green-600 font-medium mt-1">
                          ${getTotalValue(stageLeads).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </CardTitle>
                  
                  {/* Progress bar for non-terminal stages */}
                  {!['Closed Won', 'Closed Lost'].includes(stage.status) && (
                    <div className="mt-2">
                      <div className="pipeline-progress-bar" style={{
                        width: `${Math.min(100, (stageLeads.length / Math.max(leads.length / 7, 1)) * 100)}%`
                      }}></div>
                    </div>
                  )}
                </CardHeader>
                
                <CardContent className="flex-1 space-y-3 overflow-y-auto max-h-96">
                  {stageLeads.length === 0 ? (
                    <div className="pipeline-empty-state flex flex-col items-center justify-center py-8 text-center">
                      <ApperIcon name="Inbox" className="h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500 mb-1">No leads here</p>
                      <p className="text-xs text-gray-400">Drag leads to this stage</p>
                    </div>
                  ) : (
                    stageLeads.map((lead) => (
                      <div
                        key={lead.Id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, lead)}
                        onDragEnd={handleDragEnd}
                        className={`pipeline-lead-card p-3 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all ${
                          draggedLead?.Id === lead.Id ? 'dragging' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 text-sm leading-tight">
                              {lead.name}
                            </h4>
                            <p className="text-xs text-gray-600 mt-1">
                              <ApperIcon name="Phone" className="h-3 w-3 inline mr-1" />
                              {lead.phone}
                            </p>
                            <p className="text-xs text-gray-600">
                              <ApperIcon name="Mail" className="h-3 w-3 inline mr-1" />
                              {lead.email}
                            </p>
                          </div>
                          <div className="flex flex-col items-end">
                            <StatusBadge status={lead.status} />
                            {lead.contractValue && (
                              <span className="text-xs font-semibold text-green-600 mt-1">
                                ${lead.contractValue.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span className="flex items-center">
                            <ApperIcon name="Calendar" className="h-3 w-3 mr-1" />
                            {new Date(lead.dateAdded).toLocaleDateString()}
                          </span>
                          <span className="flex items-center">
                            <ApperIcon name="Clock" className="h-3 w-3 mr-1" />
                            {new Date(lead.lastContacted).toLocaleDateString()}
                          </span>
                        </div>

                        {/* Show recent activity */}
                        {lead.contactHistory && lead.contactHistory[0] && (
                          <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                            <div className="flex items-center text-gray-600">
                              <ApperIcon name="Activity" className="h-3 w-3 mr-1" />
                              <span className="capitalize">{lead.contactHistory[0].type}</span>
                              <span className="mx-1">•</span>
                              <span className={`capitalize px-1 rounded ${
                                lead.contactHistory[0].outcome === 'positive' ? 'text-green-600 bg-green-50' :
                                lead.contactHistory[0].outcome === 'negative' ? 'text-red-600 bg-red-50' :
                                'text-gray-600 bg-gray-100'
                              }`}>
                                {lead.contactHistory[0].outcome}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>

      {/* Pipeline Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-sm">
              <ApperIcon name="TrendingUp" className="h-4 w-4 mr-2" />
              Conversion Funnel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stages.slice(0, -2).map((stage, index) => {
                const count = getLeadsByStatus(stage.status).length;
                const percentage = leads.length > 0 ? Math.round((count / leads.length) * 100) : 0;
                
                return (
                  <div key={stage.status} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{stage.name}</span>
                    <div className="flex items-center">
                      <div className="w-20 h-2 bg-gray-200 rounded-full mr-2">
                        <div 
                          className={`h-full ${stage.color} rounded-full`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="font-medium">{percentage}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-sm">
              <ApperIcon name="Target" className="h-4 w-4 mr-2" />
              Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {leads.length > 0 ? Math.round((getLeadsByStatus('Closed Won').length / leads.length) * 100) : 0}%
              </div>
              <p className="text-sm text-gray-600">Overall Win Rate</p>
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-lg font-semibold text-green-600">
                    {getLeadsByStatus('Closed Won').length}
                  </div>
                  <div className="text-gray-600">Won</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-red-600">
                    {getLeadsByStatus('Closed Lost').length}
                  </div>
                  <div className="text-gray-600">Lost</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-sm">
              <ApperIcon name="DollarSign" className="h-4 w-4 mr-2" />
              Pipeline Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                ${getTotalValue(leads).toLocaleString()}
              </div>
              <p className="text-sm text-gray-600">Total Pipeline</p>
              <div className="mt-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Avg Deal Size:</span>
                  <span className="font-medium">
                    ${leads.length > 0 ? Math.round(getTotalValue(leads) / leads.length).toLocaleString() : '0'}
                  </span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-gray-600">Won Value:</span>
                  <span className="font-medium text-green-600">
                    ${getTotalValue(getLeadsByStatus('Closed Won')).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PipelineView;