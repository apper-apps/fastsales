import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms/Card';
import ApperIcon from '@/components/ApperIcon';
import Loading from '@/components/ui/Loading';
import Error from '@/components/ui/Error';
import Chart from 'react-apexcharts';
import analyticsService from '@/services/api/analyticsService';

const AnalyticsCharts = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError('');
      const [data, performanceInsights] = await Promise.all([
        analyticsService.getAnalyticsData(),
        analyticsService.getPerformanceInsights()
      ]);
      setAnalyticsData(data);
      setInsights(performanceInsights);
    } catch (err) {
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;
  if (error) return <Error message={error} onRetry={loadAnalytics} />;
  if (!analyticsData) return null;

  // Conversion Funnel Chart Configuration
  const conversionFunnelOptions = {
    chart: {
      type: 'bar',
      height: 300,
      toolbar: { show: false }
    },
    plotOptions: {
      bar: {
        horizontal: true,
        distributed: true,
        barHeight: '80%'
      }
    },
    colors: ['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#c084fc', '#10b981'],
    dataLabels: {
      enabled: true,
      formatter: (val) => `${val}%`
    },
    xaxis: {
      categories: ['Initial Contact', 'Presentation', 'Presented', 'Follow-up', 'Closed Won', 'Overall']
    },
    yaxis: {
      show: true
    },
    grid: {
      show: false
    },
    legend: {
      show: false
    }
  };

  const conversionFunnelSeries = [{
    name: 'Conversion Rate',
    data: [
      parseFloat(analyticsData.conversionRates['Initial Contact'] || 0),
      parseFloat(analyticsData.conversionRates['Presentation Scheduled'] || 0),
      parseFloat(analyticsData.conversionRates['Presented'] || 0),
      parseFloat(analyticsData.conversionRates['Follow-up'] || 0),
      parseFloat(analyticsData.conversionRates['Closed Won'] || 0),
      parseFloat(analyticsData.conversionRates.overall || 0)
    ]
  }];

  // Lead Volume Trend Chart Configuration
  const leadTrendOptions = {
    chart: {
      type: 'line',
      height: 300,
      toolbar: { show: false }
    },
    stroke: {
      curve: 'smooth',
      width: 3
    },
    colors: ['#3b82f6', '#10b981', '#ef4444'],
    xaxis: {
      categories: analyticsData.leadVolumeTrends.map(item => 
        new Date(item.month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      )
    },
    yaxis: {
      title: {
        text: 'Number of Leads'
      }
    },
    grid: {
      strokeDashArray: 4
    },
    legend: {
      position: 'top'
    }
  };

  const leadTrendSeries = [
    {
      name: 'New Leads',
      data: analyticsData.leadVolumeTrends.map(item => item.new)
    },
    {
      name: 'Converted',
      data: analyticsData.leadVolumeTrends.map(item => item.converted)
    },
    {
      name: 'Lost',
      data: analyticsData.leadVolumeTrends.map(item => item.lost)
    }
  ];

  // Daily Activity Trend Chart
  const dailyTrendOptions = {
    chart: {
      type: 'area',
      height: 250,
      toolbar: { show: false }
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.3
      }
    },
    colors: ['#8b5cf6'],
    stroke: {
      curve: 'smooth',
      width: 2
    },
    xaxis: {
      categories: analyticsData.trendData.slice(-7).map(item => 
        new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' })
      )
    },
    yaxis: {
      title: {
        text: 'Activity Count'
      }
    },
    grid: {
      strokeDashArray: 4
    }
  };

  const dailyTrendSeries = [{
    name: 'Total Activity',
    data: analyticsData.trendData.slice(-7).map(item => 
      item.leads + item.appointments + item.conversions
    )
  }];

  return (
    <div className="space-y-6">
      {/* Performance Insights */}
      {insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ApperIcon name="Lightbulb" className="h-5 w-5" />
              Performance Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insights.map((insight, index) => (
                <div key={index} className={`flex items-start gap-3 p-3 rounded-lg border ${
                  insight.type === 'success' ? 'bg-green-50 border-green-200' :
                  insight.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                  'bg-blue-50 border-blue-200'
                }`}>
                  <ApperIcon 
                    name={
                      insight.type === 'success' ? 'CheckCircle' :
                      insight.type === 'warning' ? 'AlertTriangle' : 'Info'
                    }
                    className={`h-5 w-5 mt-0.5 ${
                      insight.type === 'success' ? 'text-green-600' :
                      insight.type === 'warning' ? 'text-yellow-600' :
                      'text-blue-600'
                    }`}
                  />
                  <div>
                    <h4 className="font-medium text-gray-900">{insight.title}</h4>
                    <p className="text-sm text-gray-600">{insight.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversion Funnel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ApperIcon name="TrendingUp" className="h-5 w-5" />
              Conversion Rates by Stage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Chart
              options={conversionFunnelOptions}
              series={conversionFunnelSeries}
              type="bar"
              height={300}
            />
          </CardContent>
        </Card>

        {/* Lead Volume Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ApperIcon name="BarChart3" className="h-5 w-5" />
              Monthly Lead Volume
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Chart
              options={leadTrendOptions}
              series={leadTrendSeries}
              type="line"
              height={300}
            />
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ApperIcon name="Clock" className="h-5 w-5" />
              Pipeline Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Avg. Time in Pipeline</span>
              <span className="font-semibold">{analyticsData.pipelineMetrics.averageTimeInPipeline} days</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Pipeline Velocity</span>
              <span className="font-semibold">{analyticsData.pipelineMetrics.velocity} leads/week</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Active Leads</span>
              <span className="font-semibold">{analyticsData.pipelineMetrics.activeLeads}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Pipeline Value</span>
              <span className="font-semibold">${analyticsData.pipelineMetrics.totalValue.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        {/* Appointment Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ApperIcon name="Calendar" className="h-5 w-5" />
              Appointment Analytics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Show Rate</span>
              <span className="font-semibold text-green-600">{analyticsData.appointmentMetrics.showRate}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Completion Rate</span>
              <span className="font-semibold">{analyticsData.appointmentMetrics.completionRate}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Conversion Rate</span>
              <span className="font-semibold text-blue-600">{analyticsData.appointmentMetrics.appointmentConversionRate}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Upcoming</span>
              <span className="font-semibold">{analyticsData.appointmentMetrics.upcomingCount}</span>
            </div>
          </CardContent>
        </Card>

        {/* Closing Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ApperIcon name="Target" className="h-5 w-5" />
              Closing Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Closing Rate</span>
              <span className="font-semibold text-green-600">{analyticsData.closingMetrics.closingPercentage}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Overall Win Rate</span>
              <span className="font-semibold">{analyticsData.closingMetrics.overallClosingRate}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Avg. Deal Size</span>
              <span className="font-semibold">${analyticsData.closingMetrics.averageDealSize}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Won/Lost</span>
              <span className="font-semibold">{analyticsData.closingMetrics.totalWon}/{analyticsData.closingMetrics.totalLost}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Activity Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ApperIcon name="Activity" className="h-5 w-5" />
            Last 7 Days Activity Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Chart
            options={dailyTrendOptions}
            series={dailyTrendSeries}
            type="area"
            height={250}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsCharts;