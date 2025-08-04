import React, { useState } from "react";
import MessageTemplatesModal from "@/components/organisms/MessageTemplatesModal";
import { toast } from "react-toastify";
import ApperIcon from "@/components/ApperIcon";
import FormField from "@/components/molecules/FormField";
import Input from "@/components/atoms/Input";
import Button from "@/components/atoms/Button";
import Select from "@/components/atoms/Select";
import Label from "@/components/atoms/Label";
import { Card } from "@/components/atoms/Card";

const AddActivityModal = ({ isOpen, onClose, lead, onActivityAdd }) => {
const [activityData, setActivityData] = useState({
    type: "call",
    action: "completed", 
    outcome: "neutral",
    description: "",
    date: new Date().toISOString().slice(0, 16),
    objection: {
      type: "",
      description: "",
      aiResponse: "",
      followUpStrategy: ""
    }
  });
  const [loading, setLoading] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const activityTypes = [
    { value: "call", label: "Phone Call", icon: "Phone" },
    { value: "email", label: "Email", icon: "Mail" },
    { value: "text", label: "Text Message", icon: "MessageSquare" },
    { value: "meeting", label: "In-Person Meeting", icon: "Users" },
    { value: "social", label: "Social Media", icon: "Share2" },
    { value: "referral", label: "Referral", icon: "UserPlus" },
    { value: "presentation", label: "Presentation", icon: "Presentation" },
    { value: "enrollment", label: "Enrollment", icon: "CheckCircle" }
  ];

  const actionTypes = [
    { value: "completed", label: "Completed" },
    { value: "attempted", label: "Attempted" },
    { value: "scheduled", label: "Scheduled" },
    { value: "sent", label: "Sent" },
    { value: "received", label: "Received" },
    { value: "connected", label: "Connected" }
  ];

  const outcomeTypes = [
    { value: "positive", label: "Positive - Moving Forward" },
    { value: "neutral", label: "Neutral - No Change" },
    { value: "negative", label: "Negative - Lost Interest" }
  ];
const objectionTypes = [
    { value: "", label: "No objection encountered" },
    { value: "price", label: "Price/Cost Concerns", icon: "DollarSign" },
    { value: "time", label: "Not the Right Time", icon: "Clock" },
    { value: "skepticism", label: "Product Skepticism", icon: "AlertCircle" },
    { value: "need", label: "Don't See the Need", icon: "HelpCircle" },
    { value: "authority", label: "Need to Consult Others", icon: "Users" },
    { value: "trust", label: "Trust/Credibility Issues", icon: "Shield" },
    { value: "competition", label: "Comparing Competitors", icon: "Target" },
    { value: "timing", label: "Bad Timing", icon: "Calendar" }
  ];

  const generateAIResponse = (objectionType, leadInfo, outcome) => {
    if (!objectionType) return { response: "", strategy: "" };

    const responses = {
      price: {
        response: `I understand cost is a concern. Let me help you see the value: Our solution typically pays for itself within 3-6 months through [specific benefit relevant to ${leadInfo?.company || 'your business'}]. Many clients initially had the same concern, but found the ROI exceeded their expectations.`,
        strategy: `Follow up with ROI calculator, case studies from similar businesses, and consider offering payment plan options. Schedule value demonstration call.`
      },
      time: {
        response: `I appreciate your honesty about timing. Many successful clients felt the same way initially. The question is: will the timing ever be perfect, or could waiting actually cost you more? Let's explore what 'right time' looks like for you.`,
        strategy: `Uncover the real reasons behind timing concerns. Schedule check-in call in 2-4 weeks. Send valuable content to stay top-of-mind.`
      },
      skepticism: {
        response: `Healthy skepticism shows you're a thoughtful decision-maker. I'd be skeptical too! That's exactly why we offer [guarantee/trial/proof]. Let me share some results from clients who had similar concerns initially.`,
        strategy: `Provide social proof, testimonials, and risk-free trial options. Offer product demonstration or reference calls with existing clients.`
      },
      need: {
        response: `That's fair - if you don't see the need, this isn't right for you. Help me understand: what would need to change in your situation for this to become valuable? Sometimes the need isn't obvious until we look deeper.`,
        strategy: `Ask discovery questions to uncover hidden pain points. Share industry insights about emerging challenges they may not be aware of.`
      },
      authority: {
        response: `Absolutely - this is an important decision that affects everyone. Who else would be involved in this decision? I'd be happy to present to the whole team or provide materials that make it easy for you to share internally.`,
        strategy: `Identify all decision makers and influencers. Offer group presentation or provide decision-maker packet. Map out internal buying process.`
      },
      trust: {
        response: `Trust is earned, not given, and I respect that. What would help you feel more confident about moving forward? I'm happy to provide references, credentials, or whatever information would be most helpful.`,
        strategy: `Provide testimonials, certifications, company background. Offer reference calls with similar clients. Consider starting with smaller commitment.`
      },
      competition: {
        response: `Smart move comparing options - this is a big decision. I'm confident we'll compare favorably, but more importantly, let's make sure you're comparing the right things. What criteria matter most to you?`,
        strategy: `Create comparison matrix highlighting unique advantages. Focus on value proposition and outcomes rather than features. Schedule competitive analysis call.`
      },
      timing: {
        response: `I understand timing is everything. Help me understand what's driving the timing concern - is it budget cycles, other priorities, or something else? Maybe we can find a way to align with your timeline.`,
        strategy: `Identify specific timing constraints and work around them. Consider phased implementation or pilot programs. Stay in touch with regular value-add communications.`
      }
    };

    return responses[objectionType] || { response: "", strategy: "" };
  };

  const handleObjectionChange = (objectionType) => {
    const aiResponse = generateAIResponse(objectionType, lead, activityData.outcome);
    setActivityData(prev => ({
      ...prev,
      objection: {
        type: objectionType,
        description: prev.objection.description,
        aiResponse: aiResponse.response,
        followUpStrategy: aiResponse.strategy
      }
    }));
  };
const handleTemplateSelect = (template) => {
    // Personalize template content with lead's name
    let personalizedContent = template.content;
    if (lead?.name) {
      personalizedContent = personalizedContent.replace(/\[Name\]/g, lead.name);
    }
    
    setActivityData(prev => ({
      ...prev,
      description: personalizedContent
    }));
    
    setShowTemplatesModal(false);
    toast.success(`Template "${template.name}" applied`);
  };
const handleSubmit = async (e) => {
    e.preventDefault();
    if (!activityData.description.trim()) {
      toast.error("Please add a description for this activity");
      return;
    }

    setLoading(true);
    try {
      const activityToAdd = {
        ...activityData,
        date: new Date(activityData.date).toISOString(),
        description: activityData.description.trim(),
        objection: activityData.objection.type ? {
          type: activityData.objection.type,
          description: activityData.objection.description.trim(),
          aiResponse: activityData.objection.aiResponse,
          followUpStrategy: activityData.objection.followUpStrategy
        } : null
      };

      await onActivityAdd(lead.Id, activityToAdd);
      
      // Reset form
      setActivityData({
        type: "call",
        action: "completed",
        outcome: "neutral",
        description: "",
        date: new Date().toISOString().slice(0, 16),
        objection: {
          type: "",
          description: "",
          aiResponse: "",
          followUpStrategy: ""
        }
      });
      
      onClose();
      toast.success("Activity logged successfully!");
    } catch (error) {
      toast.error("Failed to log activity. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const selectedActivityType = activityTypes.find(type => type.value === activityData.type);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                <ApperIcon name="Clock" size={20} className="text-primary-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Log Activity</h2>
                <p className="text-sm text-gray-600">{lead?.name}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <ApperIcon name="X" size={20} />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              label="Activity Type"
              type="select"
              value={activityData.type}
              onChange={(e) => setActivityData(prev => ({ ...prev, type: e.target.value }))}
              options={activityTypes}
              required
            />

            <FormField
              label="Action"
              type="select"
              value={activityData.action}
              onChange={(e) => setActivityData(prev => ({ ...prev, action: e.target.value }))}
              options={actionTypes}
              required
            />

            <FormField
              label="Date & Time"
              type="datetime-local"
              value={activityData.date}
              onChange={(e) => setActivityData(prev => ({ ...prev, date: e.target.value }))}
              required
            />

            <FormField
label="Outcome"
              type="select"
              value={activityData.outcome}
              onChange={(e) => setActivityData(prev => ({ ...prev, outcome: e.target.value }))}
              options={outcomeTypes}
              required
            />

            {/* Objection Tracking Section */}
            <div className="space-y-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex items-center gap-2">
                <ApperIcon name="AlertTriangle" size={20} className="text-orange-600" />
                <h3 className="font-medium text-orange-900">Objection Tracking</h3>
              </div>
              
              <FormField
                label="Did the prospect raise any objections?"
                type="select"
                value={activityData.objection.type}
                onChange={(e) => handleObjectionChange(e.target.value)}
                options={objectionTypes}
              />

              {activityData.objection.type && (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="objection-description">Objection Details</Label>
                    <textarea
                      id="objection-description"
                      value={activityData.objection.description}
                      onChange={(e) => setActivityData(prev => ({
                        ...prev,
                        objection: { ...prev.objection, description: e.target.value }
                      }))}
                      placeholder="Describe the specific objection raised..."
                      className="w-full min-h-20 px-3 py-2 border border-orange-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-y"
                    />
                  </div>

                  {activityData.objection.aiResponse && (
                    <div className="space-y-3">
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2 mb-2">
                          <ApperIcon name="Bot" size={16} className="text-blue-600" />
                          <span className="text-sm font-medium text-blue-900">AI-Suggested Response</span>
                        </div>
                        <p className="text-sm text-blue-800 leading-relaxed">
                          {activityData.objection.aiResponse}
                        </p>
                      </div>

                      <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center gap-2 mb-2">
                          <ApperIcon name="Target" size={16} className="text-green-600" />
                          <span className="text-sm font-medium text-green-900">Follow-up Strategy</span>
                        </div>
                        <p className="text-sm text-green-800 leading-relaxed">
                          {activityData.objection.followUpStrategy}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

<div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="description">Description & Notes</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTemplatesModal(true)}
                  className="flex items-center gap-2 text-primary-600 hover:text-primary-700"
                >
                  <ApperIcon name="MessageSquare" size={16} />
                  Use Template
                </Button>
              </div>
              <textarea
                id="description"
                value={activityData.description}
                onChange={(e) => setActivityData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what happened during this contact..."
                className="w-full min-h-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-y"
                required
              />
              {activityData.description && (
                <p className="text-xs text-gray-500">
                  {activityData.description.length} characters
                </p>
              )}
            </div>

{activityData.outcome === "positive" && (
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <div className="flex items-center">
                  <ApperIcon name="TrendingUp" size={16} className="text-green-600 mr-2" />
                  <p className="text-sm text-green-800">
                    Positive outcome will advance lead status if applicable
                  </p>
                </div>
              </div>
            )}

            {activityData.outcome === "negative" && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <div className="flex items-center">
                  <ApperIcon name="TrendingDown" size={16} className="text-red-600 mr-2" />
                  <p className="text-sm text-red-800">
                    Negative outcome may update lead status to reflect lost interest
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 flex items-center justify-center"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <ApperIcon name="Loader2" size={16} className="mr-2 animate-spin" />
                    Logging...
                  </>
                ) : (
                  <>
                    <ApperIcon name="Plus" size={16} className="mr-2" />
                    Log Activity
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
</Card>

      <MessageTemplatesModal
        isOpen={showTemplatesModal}
        onClose={() => setShowTemplatesModal(false)}
        onSelectTemplate={handleTemplateSelect}
      />
    </div>
  );
};

export default AddActivityModal;