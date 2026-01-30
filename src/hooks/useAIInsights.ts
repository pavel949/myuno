import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// ─────────────────────────────────────────────────────────────────────────────
// PHASE J: AI SIGNAL METRICS
// ─────────────────────────────────────────────────────────────────────────────

export interface AIInsightMetrics {
  // Admin Interaction Metrics
  totalArtifacts: number;
  reviewedCount: number;
  reviewedPercent: number;
  acknowledgedCount: number;
  dismissedCount: number;
  acknowledgeRatio: number; // acknowledged / (acknowledged + dismissed)
  
  // Quality Distribution
  avgScore: number | null;
  scoreDistribution: {
    excellent: number; // 80-100
    good: number;      // 60-79
    fair: number;      // 40-59
    poor: number;      // 0-39
  };
  suspiciousCount: number;
  suspiciousPercent: number;
  
  // Issue Analysis
  topIssues: { code: string; count: number; label: string }[];
  criticalIssueCount: number;
  
  // Feedback Loop
  avgFeedbackRating: number | null;
  feedbackCount: number;
  falsePositives: number; // dismissed suspicious
  missedIssues: number;   // approved but low score
  
  // Time-based
  period: '7d' | '14d' | '30d';
  dataAvailable: boolean;
}

export interface AIInsightTrend {
  direction: 'up' | 'down' | 'stable';
  change: number; // percentage change
}

export interface WeeklySummary {
  dateRange: string;
  totalAnalyzed: number;
  avgScore: number | null;
  suspiciousRate: number;
  topIssues: string[];
  feedbackScore: number | null;
  recommendation: 'keep' | 'adjust' | 'scale' | 'insufficient_data';
  insights: string[];
}

// Issue code labels for human-readable display
const ISSUE_LABELS: Record<string, { en: string; ru: string }> = {
  'price_anomaly': { en: 'Price Anomaly', ru: 'Аномалия цены' },
  'missing_images': { en: 'Missing Images', ru: 'Нет изображений' },
  'short_description': { en: 'Short Description', ru: 'Короткое описание' },
  'contact_in_description': { en: 'Contact in Description', ru: 'Контакт в описании' },
  'duplicate_suspected': { en: 'Duplicate Suspected', ru: 'Возможный дубликат' },
  'low_quality_images': { en: 'Low Quality Images', ru: 'Низкое качество фото' },
  'incomplete_location': { en: 'Incomplete Location', ru: 'Неполный адрес' },
  'suspicious_provider': { en: 'Suspicious Provider', ru: 'Подозрительный провайдер' },
  'unrealistic_claims': { en: 'Unrealistic Claims', ru: 'Нереалистичные заявления' },
  'missing_amenities': { en: 'Missing Amenities', ru: 'Не указаны удобства' },
};

export function useAIInsights(period: '7d' | '14d' | '30d' = '14d') {
  return useQuery({
    queryKey: ['ai-insights', period],
    queryFn: async (): Promise<AIInsightMetrics> => {
      const days = period === '7d' ? 7 : period === '14d' ? 14 : 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      // Fetch all quality analysis artifacts for the period
      const { data: artifacts, error } = await supabase
        .from('ai_artifacts')
        .select('*')
        .eq('artifact_type', 'quality_analysis')
        .gte('created_at', startDate.toISOString());
      
      if (error) throw error;
      
      // If no data, return empty metrics
      if (!artifacts || artifacts.length === 0) {
        return getEmptyMetrics(period);
      }
      
      // Calculate metrics
      const totalArtifacts = artifacts.length;
      const reviewedCount = artifacts.filter(a => a.is_reviewed).length;
      const acknowledgedCount = artifacts.filter(a => a.admin_action === 'acknowledged').length;
      const dismissedCount = artifacts.filter(a => a.admin_action === 'dismissed').length;
      const suspiciousCount = artifacts.filter(a => a.verdict === 'suspicious').length;
      
      // Score distribution
      const scoresValid = artifacts.filter(a => a.primary_score !== null);
      const avgScore = scoresValid.length > 0 
        ? scoresValid.reduce((sum, a) => sum + (a.primary_score || 0), 0) / scoresValid.length 
        : null;
      
      const scoreDistribution = {
        excellent: scoresValid.filter(a => (a.primary_score || 0) >= 80).length,
        good: scoresValid.filter(a => (a.primary_score || 0) >= 60 && (a.primary_score || 0) < 80).length,
        fair: scoresValid.filter(a => (a.primary_score || 0) >= 40 && (a.primary_score || 0) < 60).length,
        poor: scoresValid.filter(a => (a.primary_score || 0) < 40).length,
      };
      
      // Issue analysis
      const issueCounts: Record<string, number> = {};
      let criticalIssueCount = 0;
      
      artifacts.forEach(artifact => {
        const data = artifact.data as Record<string, unknown>;
        const issues = (data?.issues || []) as Array<{ code: string; severity?: string }>;
        
        issues.forEach(issue => {
          issueCounts[issue.code] = (issueCounts[issue.code] || 0) + 1;
          if (issue.severity === 'critical') {
            criticalIssueCount++;
          }
        });
      });
      
      const topIssues = Object.entries(issueCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([code, count]) => ({
          code,
          count,
          label: ISSUE_LABELS[code]?.en || code,
        }));
      
      // Feedback analysis
      const withFeedback = artifacts.filter(a => a.feedback_rating !== null);
      const avgFeedbackRating = withFeedback.length > 0
        ? withFeedback.reduce((sum, a) => sum + (a.feedback_rating || 0), 0) / withFeedback.length
        : null;
      
      // False positives: dismissed but was marked suspicious
      const falsePositives = artifacts.filter(
        a => a.admin_action === 'dismissed' && a.verdict === 'suspicious'
      ).length;
      
      // Missed issues: approved/acknowledged but low score
      const missedIssues = artifacts.filter(
        a => a.admin_action === 'acknowledged' && (a.primary_score || 100) < 50
      ).length;
      
      return {
        totalArtifacts,
        reviewedCount,
        reviewedPercent: totalArtifacts > 0 ? (reviewedCount / totalArtifacts) * 100 : 0,
        acknowledgedCount,
        dismissedCount,
        acknowledgeRatio: (acknowledgedCount + dismissedCount) > 0
          ? acknowledgedCount / (acknowledgedCount + dismissedCount)
          : 0,
        avgScore,
        scoreDistribution,
        suspiciousCount,
        suspiciousPercent: totalArtifacts > 0 ? (suspiciousCount / totalArtifacts) * 100 : 0,
        topIssues,
        criticalIssueCount,
        avgFeedbackRating,
        feedbackCount: withFeedback.length,
        falsePositives,
        missedIssues,
        period,
        dataAvailable: true,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useWeeklySummary() {
  return useQuery({
    queryKey: ['ai-weekly-summary'],
    queryFn: async (): Promise<WeeklySummary> => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      const endDate = new Date();
      
      const { data: artifacts, error } = await supabase
        .from('ai_artifacts')
        .select('*')
        .eq('artifact_type', 'quality_analysis')
        .gte('created_at', startDate.toISOString());
      
      if (error) throw error;
      
      if (!artifacts || artifacts.length === 0) {
        return {
          dateRange: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
          totalAnalyzed: 0,
          avgScore: null,
          suspiciousRate: 0,
          topIssues: [],
          feedbackScore: null,
          recommendation: 'insufficient_data',
          insights: ['No data available for this period. AI analysis has not been run on any listings yet.'],
        };
      }
      
      const totalAnalyzed = artifacts.length;
      const scoresValid = artifacts.filter(a => a.primary_score !== null);
      const avgScore = scoresValid.length > 0
        ? Math.round(scoresValid.reduce((sum, a) => sum + (a.primary_score || 0), 0) / scoresValid.length)
        : null;
      
      const suspiciousCount = artifacts.filter(a => a.verdict === 'suspicious').length;
      const suspiciousRate = (suspiciousCount / totalAnalyzed) * 100;
      
      // Top issues
      const issueCounts: Record<string, number> = {};
      artifacts.forEach(artifact => {
        const data = artifact.data as Record<string, unknown>;
        const issues = (data?.issues || []) as Array<{ code: string }>;
        issues.forEach(issue => {
          issueCounts[issue.code] = (issueCounts[issue.code] || 0) + 1;
        });
      });
      
      const topIssues = Object.entries(issueCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([code]) => ISSUE_LABELS[code]?.en || code);
      
      // Feedback
      const withFeedback = artifacts.filter(a => a.feedback_rating !== null);
      const feedbackScore = withFeedback.length > 0
        ? Math.round(withFeedback.reduce((sum, a) => sum + (a.feedback_rating || 0), 0) / withFeedback.length * 10) / 10
        : null;
      
      // Generate insights
      const insights: string[] = [];
      
      if (avgScore !== null) {
        if (avgScore >= 75) {
          insights.push(`Average quality score of ${avgScore}/100 indicates healthy catalog quality.`);
        } else if (avgScore >= 50) {
          insights.push(`Average quality score of ${avgScore}/100 suggests room for improvement.`);
        } else {
          insights.push(`Low average quality score of ${avgScore}/100 requires attention.`);
        }
      }
      
      if (suspiciousRate > 20) {
        insights.push(`High suspicious rate (${Math.round(suspiciousRate)}%) may indicate quality control issues.`);
      } else if (suspiciousRate > 0) {
        insights.push(`${Math.round(suspiciousRate)}% of listings flagged as suspicious.`);
      }
      
      if (topIssues.length > 0) {
        insights.push(`Most common issues: ${topIssues.join(', ')}.`);
      }
      
      // Recommendation logic
      let recommendation: 'keep' | 'adjust' | 'scale' | 'insufficient_data' = 'keep';
      
      if (totalAnalyzed < 10) {
        recommendation = 'insufficient_data';
      } else if (avgScore !== null && avgScore >= 70 && suspiciousRate < 15) {
        recommendation = 'scale';
      } else if (suspiciousRate > 30 || (avgScore !== null && avgScore < 50)) {
        recommendation = 'adjust';
      }
      
      return {
        dateRange: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
        totalAnalyzed,
        avgScore,
        suspiciousRate: Math.round(suspiciousRate),
        topIssues,
        feedbackScore,
        recommendation,
        insights,
      };
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

function getEmptyMetrics(period: '7d' | '14d' | '30d'): AIInsightMetrics {
  return {
    totalArtifacts: 0,
    reviewedCount: 0,
    reviewedPercent: 0,
    acknowledgedCount: 0,
    dismissedCount: 0,
    acknowledgeRatio: 0,
    avgScore: null,
    scoreDistribution: { excellent: 0, good: 0, fair: 0, poor: 0 },
    suspiciousCount: 0,
    suspiciousPercent: 0,
    topIssues: [],
    criticalIssueCount: 0,
    avgFeedbackRating: null,
    feedbackCount: 0,
    falsePositives: 0,
    missedIssues: 0,
    period,
    dataAvailable: false,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 14-DAY ROI REPORT FOR PAVEL
// ─────────────────────────────────────────────────────────────────────────────

export interface ROIReport {
  period: string;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendation: 'KEEP' | 'ADJUST' | 'SCALE';
  nextSteps: string[];
  metrics: {
    listingsAnalyzed: number;
    avgQualityScore: number | null;
    suspiciousDetected: number;
    adminReviewRate: number;
    aiAccuracyProxy: number | null; // based on acknowledge ratio
  };
}

export function useROIReport() {
  return useQuery({
    queryKey: ['ai-roi-report'],
    queryFn: async (): Promise<ROIReport> => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 14);
      
      const { data: artifacts } = await supabase
        .from('ai_artifacts')
        .select('*')
        .eq('artifact_type', 'quality_analysis')
        .gte('created_at', startDate.toISOString());
      
      const totalAnalyzed = artifacts?.length || 0;
      
      if (totalAnalyzed === 0) {
        return {
          period: '14 days',
          summary: 'AI quality analysis has been deployed but no listings have been analyzed yet. The system is ready and waiting for data.',
          strengths: ['Infrastructure is live and ready', 'No errors or failures detected'],
          weaknesses: ['No real data to evaluate AI performance yet'],
          recommendation: 'KEEP',
          nextSteps: [
            'Run AI analysis on existing catalog listings',
            'Monitor first batch of results',
            'Collect admin feedback on AI accuracy',
          ],
          metrics: {
            listingsAnalyzed: 0,
            avgQualityScore: null,
            suspiciousDetected: 0,
            adminReviewRate: 0,
            aiAccuracyProxy: null,
          },
        };
      }
      
      const reviewed = artifacts?.filter(a => a.is_reviewed).length || 0;
      const acknowledged = artifacts?.filter(a => a.admin_action === 'acknowledged').length || 0;
      const dismissed = artifacts?.filter(a => a.admin_action === 'dismissed').length || 0;
      const suspicious = artifacts?.filter(a => a.verdict === 'suspicious').length || 0;
      
      const scoresValid = artifacts?.filter(a => a.primary_score !== null) || [];
      const avgScore = scoresValid.length > 0
        ? Math.round(scoresValid.reduce((sum, a) => sum + (a.primary_score || 0), 0) / scoresValid.length)
        : null;
      
      const reviewRate = (reviewed / totalAnalyzed) * 100;
      const accuracyProxy = (acknowledged + dismissed) > 0
        ? (acknowledged / (acknowledged + dismissed)) * 100
        : null;
      
      // Generate report
      const strengths: string[] = [];
      const weaknesses: string[] = [];
      
      if (avgScore !== null && avgScore >= 70) {
        strengths.push('Catalog quality is above average');
      }
      if (accuracyProxy !== null && accuracyProxy >= 70) {
        strengths.push('AI recommendations are mostly accepted by admins');
      }
      if (suspicious > 0) {
        strengths.push(`AI detected ${suspicious} suspicious listings that may have been missed manually`);
      }
      
      if (reviewRate < 50) {
        weaknesses.push('Admin review rate is low - AI insights are not being utilized');
      }
      if (accuracyProxy !== null && accuracyProxy < 50) {
        weaknesses.push('High dismiss rate suggests AI needs tuning');
      }
      if (avgScore !== null && avgScore < 50) {
        weaknesses.push('Overall catalog quality needs improvement');
      }
      
      let recommendation: 'KEEP' | 'ADJUST' | 'SCALE' = 'KEEP';
      if (accuracyProxy !== null && accuracyProxy >= 70 && reviewRate >= 30) {
        recommendation = 'SCALE';
      } else if ((accuracyProxy !== null && accuracyProxy < 50) || reviewRate < 20) {
        recommendation = 'ADJUST';
      }
      
      const nextSteps = recommendation === 'SCALE'
        ? ['Enable review-quality-scorer agent', 'Expand to all new listings automatically', 'Set up weekly quality reports']
        : recommendation === 'ADJUST'
        ? ['Review dismissed cases to understand false positives', 'Tune AI prompt based on feedback', 'Increase admin training on AI tools']
        : ['Continue monitoring for 1 more week', 'Gather more admin feedback', 'Evaluate expansion criteria'];
      
      return {
        period: '14 days',
        summary: `AI analyzed ${totalAnalyzed} listings with an average quality score of ${avgScore ?? 'N/A'}/100. ${reviewed} were reviewed by admins (${Math.round(reviewRate)}%). ${suspicious} suspicious listings were flagged.`,
        strengths: strengths.length > 0 ? strengths : ['System is operational'],
        weaknesses: weaknesses.length > 0 ? weaknesses : ['More data needed for full evaluation'],
        recommendation,
        nextSteps,
        metrics: {
          listingsAnalyzed: totalAnalyzed,
          avgQualityScore: avgScore,
          suspiciousDetected: suspicious,
          adminReviewRate: Math.round(reviewRate),
          aiAccuracyProxy: accuracyProxy !== null ? Math.round(accuracyProxy) : null,
        },
      };
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}
