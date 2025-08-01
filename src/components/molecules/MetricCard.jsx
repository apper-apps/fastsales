import React from "react";
import { Card, CardContent } from "@/components/atoms/Card";
import ApperIcon from "@/components/ApperIcon";

const MetricCard = ({ title, value, icon, trend, trendValue, className }) => {
  const getTrendColor = () => {
    if (!trend) return "text-gray-500";
    return trend === "up" ? "text-green-600" : "text-red-600";
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    return trend === "up" ? "TrendingUp" : "TrendingDown";
  };

  return (
    <Card className={`transform hover:scale-[1.02] transition-all duration-200 ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
              {value}
            </p>
            {trend && (
              <div className={`flex items-center mt-2 text-sm ${getTrendColor()}`}>
                <ApperIcon name={getTrendIcon()} className="h-4 w-4 mr-1" />
                <span>{trendValue}</span>
              </div>
            )}
          </div>
          <div className="p-3 bg-gradient-to-br from-primary-500 to-purple-600 rounded-lg">
            <ApperIcon name={icon} className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MetricCard;