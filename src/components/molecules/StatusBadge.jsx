import React from "react";
import Badge from "@/components/atoms/Badge";

const StatusBadge = ({ status }) => {
  const getStatusVariant = (status) => {
    switch (status?.toLowerCase()) {
      case "new":
        return "new";
      case "contacted":
        return "contacted";
      case "interested":
        return "interested";
      case "not interested":
        return "not-interested";
      default:
        return "default";
    }
  };

  return <Badge variant={getStatusVariant(status)}>{status}</Badge>;
};

export default StatusBadge;