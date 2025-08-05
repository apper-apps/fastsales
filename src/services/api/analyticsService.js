import leadsService from '@/services/api/leadsService';
import appointmentsService from '@/services/api/appointmentsService';

class AnalyticsService {
  async getAnalyticsData() {
    const [leads, appointments] = await Promise.all([
      leadsService.getAll(),
      appointmentsService.getAll()
    ]);

    return {
      conversionRates: this.calculateConversionRates(leads),
      pipelineMetrics: this.calculatePipelineMetrics(leads),
      leadVolumeTrends: this.calculateLeadVolumeTrends(leads),
      appointmentMetrics: this.calculateAppointmentMetrics(appointments, leads),
      closingMetrics: this.calculateClosingMetrics(leads),
      trendData: this.generateTrendData(leads, appointments)
    };
  }

  calculateConversionRates(leads) {
    const stages = [
      'New Leads',
      'Initial Contact', 
      'Presentation Scheduled',
      'Presented',
      'Follow-up',
      'Closed Won'
    ];

    const stageData = {};
    stages.forEach(stage => {
      stageData[stage] = leads.filter(lead => lead.status === stage).length;
    });

    const rates = {};
    for (let i = 1; i < stages.length; i++) {
      const current = stageData[stages[i]];
      const previous = stageData[stages[i-1]];
      rates[stages[i]] = previous > 0 ? ((current / previous) * 100).toFixed(1) : 0;
    }

    // Overall conversion rate (New Leads to Closed Won)
    const totalNew = stageData['New Leads'] + stageData['Initial Contact'] + 
                     stageData['Presentation Scheduled'] + stageData['Presented'] + 
                     stageData['Follow-up'] + stageData['Closed Won'];
    rates.overall = totalNew > 0 ? ((stageData['Closed Won'] / totalNew) * 100).toFixed(1) : 0;

    return rates;
  }

  calculatePipelineMetrics(leads) {
    const now = new Date();
    let totalDays = 0;
    let completedLeads = 0;

    leads.forEach(lead => {
      const dateAdded = new Date(lead.dateAdded);
      const daysDiff = (now - dateAdded) / (1000 * 60 * 60 * 24);
      
      if (lead.status === 'Closed Won' || lead.status === 'Closed Lost') {
        totalDays += daysDiff;
        completedLeads++;
      }
    });

    const averageTimeInPipeline = completedLeads > 0 ? (totalDays / completedLeads).toFixed(1) : 0;

    // Pipeline velocity (leads moving per week)
    const recentLeads = leads.filter(lead => {
      const dateAdded = new Date(lead.dateAdded);
      const daysAgo = (now - dateAdded) / (1000 * 60 * 60 * 24);
      return daysAgo <= 30;
    });

    const velocity = recentLeads.length > 0 ? (recentLeads.length / 4.3).toFixed(1) : 0; // per week

    return {
      averageTimeInPipeline,
      velocity,
      activeLeads: leads.filter(lead => 
        !['Closed Won', 'Closed Lost'].includes(lead.status)
      ).length,
      totalValue: leads
        .filter(lead => lead.contractValue)
        .reduce((sum, lead) => sum + (lead.contractValue || 0), 0)
    };
  }

  calculateLeadVolumeTrends(leads) {
    const monthlyData = {};
    const now = new Date();
    
    // Get last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[monthKey] = { new: 0, converted: 0, lost: 0 };
    }

    leads.forEach(lead => {
      const dateAdded = new Date(lead.dateAdded);
      const monthKey = `${dateAdded.getFullYear()}-${String(dateAdded.getMonth() + 1).padStart(2, '0')}`;
      
      if (monthlyData[monthKey]) {
        monthlyData[monthKey].new++;
        
        if (lead.status === 'Closed Won') {
          monthlyData[monthKey].converted++;
        } else if (lead.status === 'Closed Lost') {
          monthlyData[monthKey].lost++;
        }
      }
    });

    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      ...data
    }));
  }

  calculateAppointmentMetrics(appointments, leads) {
    const total = appointments.length;
    const completed = appointments.filter(apt => apt.status === 'completed').length;
    const noShow = appointments.filter(apt => apt.status === 'no_show').length;
    const cancelled = appointments.filter(apt => apt.status === 'cancelled').length;

    const showRate = total > 0 ? (((total - noShow - cancelled) / total) * 100).toFixed(1) : 0;
    const completionRate = total > 0 ? ((completed / total) * 100).toFixed(1) : 0;

    // Appointment to conversion rate
    const appointmentLeadIds = appointments.map(apt => apt.leadId);
    const appointmentLeads = leads.filter(lead => appointmentLeadIds.includes(lead.Id));
    const convertedFromAppointments = appointmentLeads.filter(lead => lead.status === 'Closed Won').length;
    const appointmentConversionRate = appointmentLeads.length > 0 ? 
      ((convertedFromAppointments / appointmentLeads.length) * 100).toFixed(1) : 0;

    return {
      total,
      completed,
      noShow,
      cancelled,
      showRate,
      completionRate,
      appointmentConversionRate,
      upcomingCount: appointments.filter(apt => 
        new Date(apt.scheduledDateTime) > new Date() && apt.status === 'scheduled'
      ).length
    };
  }

  calculateClosingMetrics(leads) {
    const totalLeads = leads.length;
    const closedWon = leads.filter(lead => lead.status === 'Closed Won').length;
    const closedLost = leads.filter(lead => lead.status === 'Closed Lost').length;
    const totalClosed = closedWon + closedLost;

    const closingPercentage = totalClosed > 0 ? ((closedWon / totalClosed) * 100).toFixed(1) : 0;
    const overallClosingRate = totalLeads > 0 ? ((closedWon / totalLeads) * 100).toFixed(1) : 0;

    // Calculate average deal size
    const wonLeads = leads.filter(lead => lead.status === 'Closed Won' && lead.contractValue);
    const averageDealSize = wonLeads.length > 0 ? 
      (wonLeads.reduce((sum, lead) => sum + lead.contractValue, 0) / wonLeads.length).toFixed(0) : 0;

    // Win rate by source (if available)
    const sourceMetrics = {};
    leads.forEach(lead => {
      const source = lead.source || 'Unknown';
      if (!sourceMetrics[source]) {
        sourceMetrics[source] = { total: 0, won: 0 };
      }
      sourceMetrics[source].total++;
      if (lead.status === 'Closed Won') {
        sourceMetrics[source].won++;
      }
    });

    const topPerformingSources = Object.entries(sourceMetrics)
      .map(([source, data]) => ({
        source,
        winRate: data.total > 0 ? ((data.won / data.total) * 100).toFixed(1) : 0,
        total: data.total,
        won: data.won
      }))
      .sort((a, b) => parseFloat(b.winRate) - parseFloat(a.winRate))
      .slice(0, 5);

    return {
      closingPercentage,
      overallClosingRate,
      averageDealSize,
      totalWon: closedWon,
      totalLost: closedLost,
      topPerformingSources
    };
  }

  generateTrendData(leads, appointments) {
    const last30Days = [];
    const now = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayLeads = leads.filter(lead => 
        lead.dateAdded.split('T')[0] === dateStr
      ).length;

      const dayAppointments = appointments.filter(apt =>
        apt.scheduledDateTime.split('T')[0] === dateStr
      ).length;

      const dayConversions = leads.filter(lead =>
        lead.status === 'Closed Won' && 
        lead.lastContacted.split('T')[0] === dateStr
      ).length;

      last30Days.push({
        date: dateStr,
        leads: dayLeads,
        appointments: dayAppointments,
        conversions: dayConversions
      });
    }

    return last30Days;
  }

  async getPerformanceInsights() {
    const data = await this.getAnalyticsData();
    const insights = [];

    // Conversion rate insights
    if (parseFloat(data.conversionRates.overall) > 15) {
      insights.push({
        type: 'success',
        title: 'Strong Conversion Rate',
        message: `Your overall conversion rate of ${data.conversionRates.overall}% is above industry average.`
      });
    } else if (parseFloat(data.conversionRates.overall) < 5) {
      insights.push({
        type: 'warning',
        title: 'Low Conversion Rate',
        message: `Consider reviewing your lead qualification process. Current rate: ${data.conversionRates.overall}%`
      });
    }

    // Pipeline velocity insights
    if (parseFloat(data.pipelineMetrics.averageTimeInPipeline) > 60) {
      insights.push({
        type: 'info',
        title: 'Long Pipeline Cycle',
        message: `Average time in pipeline is ${data.pipelineMetrics.averageTimeInPipeline} days. Consider streamlining your process.`
      });
    }

    // Appointment show rate insights
    if (parseFloat(data.appointmentMetrics.showRate) < 70) {
      insights.push({
        type: 'warning',
        title: 'Low Appointment Show Rate',
        message: `Show rate is ${data.appointmentMetrics.showRate}%. Consider implementing reminder systems.`
      });
    }

    return insights;
  }
}

export default new AnalyticsService();