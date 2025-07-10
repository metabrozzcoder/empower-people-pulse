import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:json_annotation/json_annotation.dart';

part 'employee.freezed.dart';
part 'employee.g.dart';

@freezed
class Employee with _$Employee {
  const factory Employee({
    required int id,
    required String name,
    required String email,
    required String position,
    required String department,
    required String hireDate,
    required String birthday,
    required int salary,
    required String status,
    String? avatar,
    required String phone,
    required String location,
    String? manager,
    required int performanceScore,
  }) = _Employee;

  factory Employee.fromJson(Map<String, dynamic> json) => _$EmployeeFromJson(json);
}

@freezed
class Department with _$Department {
  const factory Department({
    required String id,
    required String name,
    required int headCount,
    required String manager,
  }) = _Department;

  factory Department.fromJson(Map<String, dynamic> json) => _$DepartmentFromJson(json);
}