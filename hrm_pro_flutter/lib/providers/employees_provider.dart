import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hrm_pro_flutter/models/employee.dart';

// Mock data
final List<Employee> _mockEmployees = [
  Employee(
    id: 1,
    name: "Alice Johnson",
    email: "alice.johnson@company.com",
    position: "Senior Software Engineer",
    department: "Engineering",
    hireDate: "2022-01-15",
    birthday: "2025-07-08",
    salary: 95000,
    status: "Active",
    phone: "+1 (555) 123-4567",
    location: "San Francisco, CA",
    manager: "David Chen",
    performanceScore: 94,
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
  ),
  Employee(
    id: 2,
    name: "Michael Rodriguez",
    email: "michael.rodriguez@company.com",
    position: "Product Manager",
    department: "Product",
    hireDate: "2021-06-20",
    birthday: "2025-07-09",
    salary: 110000,
    status: "Active",
    phone: "+1 (555) 234-5678",
    location: "New York, NY",
    manager: "Sarah Wilson",
    performanceScore: 88,
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
  ),
  Employee(
    id: 3,
    name: "Emily Davis",
    email: "emily.davis@company.com",
    position: "UX Designer",
    department: "Design",
    hireDate: "2023-03-10",
    birthday: "2025-12-15",
    salary: 75000,
    status: "Active",
    phone: "+1 (555) 345-6789",
    location: "Austin, TX",
    manager: "James Park",
    performanceScore: 92,
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
  ),
  Employee(
    id: 4,
    name: "David Chen",
    email: "david.chen@company.com",
    position: "Engineering Manager",
    department: "Engineering",
    hireDate: "2020-09-05",
    birthday: "2025-03-22",
    salary: 130000,
    status: "Active",
    phone: "+1 (555) 456-7890",
    location: "Seattle, WA",
    performanceScore: 96,
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
  ),
  Employee(
    id: 5,
    name: "Sarah Wilson",
    email: "sarah.wilson@company.com",
    position: "Head of Product",
    department: "Product",
    hireDate: "2019-11-12",
    birthday: "2025-08-11",
    salary: 145000,
    status: "Active",
    phone: "+1 (555) 567-8901",
    location: "Los Angeles, CA",
    performanceScore: 98,
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face",
  ),
  Employee(
    id: 6,
    name: "Robert Taylor",
    email: "robert.taylor@company.com",
    position: "Sales Representative",
    department: "Sales",
    hireDate: "2022-08-22",
    birthday: "2025-11-05",
    salary: 65000,
    status: "On Leave",
    phone: "+1 (555) 678-9012",
    location: "Chicago, IL",
    manager: "Lisa Brown",
    performanceScore: 85,
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
  ),
];

class EmployeesNotifier extends StateNotifier<List<Employee>> {
  EmployeesNotifier() : super(_mockEmployees);
  
  void addEmployee(Employee employee) {
    state = [...state, employee];
  }
  
  void updateEmployee(Employee employee) {
    state = state.map((e) => e.id == employee.id ? employee : e).toList();
  }
  
  void deleteEmployee(int id) {
    state = state.where((e) => e.id != id).toList();
  }
}

final employeesProvider = StateNotifierProvider<EmployeesNotifier, List<Employee>>((ref) {
  return EmployeesNotifier();
});

// Derived providers
final departmentsProvider = Provider<List<String>>((ref) {
  final employees = ref.watch(employeesProvider);
  final departments = employees.map((e) => e.department).toSet().toList();
  return departments..sort();
});

final managersProvider = Provider<List<String>>((ref) {
  final employees = ref.watch(employeesProvider);
  final managers = employees
      .where((e) => e.position.toLowerCase().contains('manager') || 
                    e.position.toLowerCase().contains('director') ||
                    e.position.toLowerCase().contains('head'))
      .map((e) => e.name)
      .toSet()
      .toList();
  return managers..sort();
});