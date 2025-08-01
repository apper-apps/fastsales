import React, { useState } from "react";
import { format } from "date-fns";
import ApperIcon from "@/components/ApperIcon";
import StatusBadge from "@/components/molecules/StatusBadge";
import Button from "@/components/atoms/Button";
import Badge from "@/components/atoms/Badge";

const LeadsTable = ({ leads, onUpdateStatus, onDeleteLead, onViewLead }) => {
  const [sortField, setSortField] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (columnName) => {
    if (sortField !== columnName) return "ArrowUpDown";
    return sortDirection === "asc" ? "ArrowUp" : "ArrowDown";
  };

  const sortableLeads = [...leads];
  if (sortField) {
    sortableLeads.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      if (sortField === "dateAdded" || sortField === "lastContacted") {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (sortField === "aiScore") {
        aValue = aValue || 0;
        bValue = bValue || 0;
      }

      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      const direction = sortDirection === "asc" ? 1 : -1;
      if (aValue < bValue) return -1 * direction;
      if (aValue > bValue) return 1 * direction;
      return 0;
    });
  }

  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {[
                { key: "name", label: "Name" },
                { key: "phone", label: "Phone" },
                { key: "email", label: "Email" },
                { key: "aiScore", label: "AI Score" },
                { key: "status", label: "Status" },
                { key: "dateAdded", label: "Date Added" },
              ].map((column) => (
                <th
                  key={column.key}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort(column.key)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.label}</span>
                    <ApperIcon
                      name={getSortIcon(column.key)}
                      className="h-4 w-4"
                    />
                  </div>
                </th>
              ))}
              <th className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortableLeads.map((lead) => (
              <tr
                key={lead.Id}
                className={`hover:bg-gray-50/50 transition-all duration-200 cursor-pointer ${
                  lead.aiScore >= 80 ? 'bg-gradient-to-r from-orange-50 to-red-50 border-l-4 border-orange-400' : ''
                }`}
                onClick={() => onViewLead?.(lead)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <div className="font-medium text-gray-900">{lead.name}</div>
                    {lead.aiScore >= 80 && (
                      <ApperIcon 
                        name="Flame" 
                        className="h-4 w-4 text-orange-500 animate-pulse" 
                        title="High Priority Lead"
                      />
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                  {lead.phone}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                  {lead.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant={
                        lead.aiScore >= 90 ? "excellent" :
                        lead.aiScore >= 70 ? "high" :
                        lead.aiScore >= 40 ? "medium" : "low"
                      }
                      className="font-semibold"
                    >
                      {lead.aiScore || 0}
                    </Badge>
                    {lead.aiScore >= 80 && (
                      <span className="text-xs text-orange-600 font-medium">HOT</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge status={lead.status} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                  {format(new Date(lead.dateAdded), "MMM dd, yyyy")}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    <select
                      value={lead.status}
                      onChange={(e) => onUpdateStatus(lead.Id, e.target.value)}
                      className="text-xs border border-gray-300 rounded px-2 py-1 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                    >
                      <option value="New">New</option>
                      <option value="Contacted">Contacted</option>
                      <option value="Interested">Interested</option>
                      <option value="Not Interested">Not Interested</option>
                    </select>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDeleteLead(lead.Id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <ApperIcon name="Trash2" className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeadsTable;