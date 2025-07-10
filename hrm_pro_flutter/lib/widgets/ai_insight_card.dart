import 'package:flutter/material.dart';
import 'package:hrm_pro_flutter/models/ai_insight.dart';

class AIInsightCard extends StatelessWidget {
  final AIInsight insight;

  const AIInsightCard({
    super.key,
    required this.insight,
  });

  IconData _getTypeIcon() {
    switch (insight.type) {
      case 'recruitment':
        return Icons.people_outlined;
      case 'performance':
        return Icons.trending_up;
      case 'scheduling':
        return Icons.calendar_today_outlined;
      case 'project':
        return Icons.work_outline;
      default:
        return Icons.psychology_outlined;
    }
  }

  Color _getConfidenceColor() {
    if (insight.confidence >= 90) return Colors.green;
    if (insight.confidence >= 70) return Colors.orange;
    return Colors.red;
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(
          color: Theme.of(context).colorScheme.primary.withOpacity(0.3),
          width: 2,
        ),
      ),
      margin: const EdgeInsets.only(bottom: 16),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              children: [
                Icon(
                  _getTypeIcon(),
                  color: Theme.of(context).colorScheme.primary,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    insight.title,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: _getConfidenceColor().withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        '${insight.confidence}%',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: _getConfidenceColor(),
                        ),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        'confidence',
                        style: TextStyle(
                          fontSize: 10,
                          color: _getConfidenceColor(),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            
            // Description
            Text(
              insight.description,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Theme.of(context).colorScheme.onSurface.withOpacity(0.7),
              ),
            ),
            
            // Suggested actions
            if (insight.actionable && insight.suggestedActions != null && insight.suggestedActions!.isNotEmpty) ...[
              const SizedBox(height: 16),
              Text(
                'Suggested Actions:',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  fontWeight: FontWeight.w500,
                  color: Theme.of(context).colorScheme.onSurface.withOpacity(0.6),
                ),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: insight.suggestedActions!.map((action) {
                  return OutlinedButton(
                    onPressed: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text('Action: $action'),
                          behavior: SnackBarBehavior.floating,
                        ),
                      );
                    },
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 8,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                      textStyle: const TextStyle(fontSize: 12),
                    ),
                    child: Text(action),
                  );
                }).toList(),
              ),
            ],
          ],
        ),
      ),
    );
  }
}