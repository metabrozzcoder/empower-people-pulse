import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:json_annotation/json_annotation.dart';

part 'ai_insight.freezed.dart';
part 'ai_insight.g.dart';

@freezed
class AIInsight with _$AIInsight {
  const factory AIInsight({
    required String id,
    required String type,
    required String title,
    required String description,
    required int confidence,
    required bool actionable,
    List<String>? suggestedActions,
    required String createdAt,
  }) = _AIInsight;

  factory AIInsight.fromJson(Map<String, dynamic> json) => _$AIInsightFromJson(json);
}

@freezed
class ChatMessage with _$ChatMessage {
  const factory ChatMessage({
    required String id,
    required String type,
    required String message,
    required String timestamp,
  }) = _ChatMessage;

  factory ChatMessage.fromJson(Map<String, dynamic> json) => _$ChatMessageFromJson(json);
}