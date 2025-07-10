import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:json_annotation/json_annotation.dart';

part 'task.freezed.dart';
part 'task.g.dart';

@freezed
class Task with _$Task {
  const factory Task({
    required String id,
    required String title,
    required String description,
    required String projectId,
    required String assignedTo,
    required String status,
    required String priority,
    required String dueDate,
    required int estimatedHours,
    int? actualHours,
    required List<String> tags,
    int? position,
  }) = _Task;

  factory Task.fromJson(Map<String, dynamic> json) => _$TaskFromJson(json);
}