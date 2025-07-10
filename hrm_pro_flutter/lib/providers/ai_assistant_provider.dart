import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hrm_pro_flutter/models/ai_insight.dart';
import 'package:intl/intl.dart';

class AIAssistantState {
  final List<ChatMessage> chatHistory;
  final List<AIInsight> insights;
  final bool isLoading;
  final String? error;

  AIAssistantState({
    required this.chatHistory,
    required this.insights,
    this.isLoading = false,
    this.error,
  });

  AIAssistantState copyWith({
    List<ChatMessage>? chatHistory,
    List<AIInsight>? insights,
    bool? isLoading,
    String? error,
  }) {
    return AIAssistantState(
      chatHistory: chatHistory ?? this.chatHistory,
      insights: insights ?? this.insights,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class AIAssistantNotifier extends StateNotifier<AIAssistantState> {
  AIAssistantNotifier()
      : super(AIAssistantState(
          chatHistory: [
            ChatMessage(
              id: '1',
              type: 'ai',
              message:
                  "Hello! I'm your AI HR Assistant. I can help you with employee insights, performance analysis, recruitment recommendations, and more. What would you like to know?",
              timestamp: DateFormat('h:mm a').format(DateTime.now()),
            ),
          ],
          insights: _mockInsights,
        ));

  void sendMessage(String message) {
    // Add user message
    final userMessage = ChatMessage(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      type: 'user',
      message: message,
      timestamp: DateFormat('h:mm a').format(DateTime.now()),
    );

    state = state.copyWith(
      chatHistory: [...state.chatHistory, userMessage],
      isLoading: true,
    );

    // Simulate AI processing
    Future.delayed(const Duration(seconds: 2), () {
      final aiResponses = [
        "Based on current data, I recommend focusing on employee retention strategies. Your turnover rate has increased by 12% this quarter.",
        "I've analyzed the recruitment pipeline and found 3 high-potential candidates for the Senior Developer position. Would you like me to schedule interviews?",
        "Performance metrics show that team productivity peaks on Tuesdays and Wednesdays. Consider scheduling important meetings during these days.",
        "I notice attendance patterns suggest some employees may benefit from flexible work arrangements. Shall I prepare a proposal?",
        "Your current hiring process takes an average of 23 days. I can suggest optimizations to reduce this to 15 days.",
        "Employee satisfaction scores indicate training opportunities in leadership development would be valuable for 67% of your managers."
      ];

      final randomResponse = aiResponses[DateTime.now().millisecond % aiResponses.length];

      final aiMessage = ChatMessage(
        id: (DateTime.now().millisecondsSinceEpoch + 1).toString(),
        type: 'ai',
        message: randomResponse,
        timestamp: DateFormat('h:mm a').format(DateTime.now()),
      );

      state = state.copyWith(
        chatHistory: [...state.chatHistory, aiMessage],
        isLoading: false,
      );
    });
  }

  void performQuickAction(String action) {
    final quickResponses = {
      'Screen Resumes': "I've analyzed 45 resumes for the open positions. 12 candidates meet the minimum requirements, and 5 are exceptional matches. Would you like me to rank them?",
      'Optimize Schedule': "Based on employee preferences and productivity patterns, I've created an optimized schedule that could increase efficiency by 18%. Shall I implement it?",
      'Analyze Performance': "Performance analysis complete: 78% of employees are meeting targets, 15% are exceeding expectations, and 7% may need additional support. Detailed report ready.",
      'Risk Assessment': "I've identified 3 potential risks: high workload in Marketing (85% capacity), upcoming deadline conflicts in Development, and 2 employees showing burnout indicators.",
      'Smart Suggestions': "I've analyzed your HR processes and have 5 suggestions to improve efficiency. Would you like to hear them?",
      'Goal Tracking': "Your team is currently at 78% progress toward Q2 objectives. The recruitment goal is ahead of schedule, but the training completion rate is behind target.",
      'Compliance Check': "I've completed a compliance check. Your HR policies are 92% compliant with current regulations. There are 3 minor issues that need attention."
    };

    final response = quickResponses[action] ?? "Processing $action request...";

    final aiMessage = ChatMessage(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      type: 'ai',
      message: response,
      timestamp: DateFormat('h:mm a').format(DateTime.now()),
    );

    state = state.copyWith(
      chatHistory: [...state.chatHistory, aiMessage],
    );
  }
}

final aiAssistantProvider = StateNotifierProvider<AIAssistantNotifier, AIAssistantState>((ref) {
  return AIAssistantNotifier();
});

// Mock data
final List<AIInsight> _mockInsights = [
  AIInsight(
    id: "1",
    type: "recruitment",
    title: "High-Quality Candidate Match",
    description: "AI identified 3 candidates with 95%+ match for Senior Video Editor position based on skills analysis",
    confidence: 95,
    actionable: true,
    suggestedActions: ["Review top candidates", "Schedule interviews", "Send assessment"],
    createdAt: "2024-01-15T10:30:00Z",
  ),
  AIInsight(
    id: "2",
    type: "performance",
    title: "Team Productivity Alert",
    description: "Creative team productivity increased 23% this month. Consider workload optimization for sustained performance",
    confidence: 87,
    actionable: true,
    suggestedActions: ["Analyze workload distribution", "Plan team expansion", "Implement efficiency tools"],
    createdAt: "2024-01-15T09:15:00Z",
  ),
  AIInsight(
    id: "3",
    type: "scheduling",
    title: "Optimal Shift Scheduling",
    description: "AI suggests rotating prime-time shifts to improve team satisfaction and reduce burnout risk",
    confidence: 78,
    actionable: true,
    suggestedActions: ["Review current schedules", "Implement rotation system", "Survey team preferences"],
    createdAt: "2024-01-15T08:45:00Z",
  ),
];