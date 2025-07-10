import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:hrm_pro_flutter/models/employee.dart';
import 'package:hrm_pro_flutter/providers/employees_provider.dart';
import 'package:hrm_pro_flutter/utils/constants.dart';
import 'package:hrm_pro_flutter/widgets/employee_card.dart';
import 'package:hrm_pro_flutter/widgets/employee_form_dialog.dart';

class EmployeesScreen extends ConsumerStatefulWidget {
  const EmployeesScreen({super.key});

  @override
  ConsumerState<EmployeesScreen> createState() => _EmployeesScreenState();
}

class _EmployeesScreenState extends ConsumerState<EmployeesScreen> {
  String searchTerm = '';
  String departmentFilter = 'all';
  String statusFilter = 'all';
  
  @override
  Widget build(BuildContext context) {
    final employees = ref.watch(employeesProvider);
    final departments = ref.watch(departmentsProvider);
    
    // Apply filters
    final filteredEmployees = employees.where((employee) {
      final matchesSearch = employee.name.toLowerCase().contains(searchTerm.toLowerCase()) ||
                           employee.email.toLowerCase().contains(searchTerm.toLowerCase()) ||
                           employee.position.toLowerCase().contains(searchTerm.toLowerCase());
      
      final matchesDepartment = departmentFilter == 'all' || employee.department == departmentFilter;
      final matchesStatus = statusFilter == 'all' || employee.status == statusFilter;
      
      return matchesSearch && matchesDepartment && matchesStatus;
    }).toList();
    
    return Scaffold(
      appBar: AppBar(
        title: const Text('Employees'),
        actions: [
          IconButton(
            icon: const Icon(Icons.filter_list),
            onPressed: () {
              _showFilterBottomSheet(context, departments);
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Search bar
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              decoration: InputDecoration(
                hintText: 'Search employees...',
                prefixIcon: const Icon(Icons.search),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                contentPadding: const EdgeInsets.symmetric(vertical: 12),
              ),
              onChanged: (value) {
                setState(() {
                  searchTerm = value;
                });
              },
            ),
          ),
          
          // Results count
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              children: [
                Text(
                  'Showing ${filteredEmployees.length} of ${employees.length} employees',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Theme.of(context).colorScheme.onBackground.withOpacity(0.6),
                  ),
                ),
                const Spacer(),
                if (departmentFilter != 'all' || statusFilter != 'all')
                  TextButton(
                    onPressed: () {
                      setState(() {
                        departmentFilter = 'all';
                        statusFilter = 'all';
                      });
                    },
                    child: const Text('Clear Filters'),
                  ),
              ],
            ),
          ),
          
          // Employee grid
          Expanded(
            child: filteredEmployees.isEmpty
                ? Center(
                    child: Text(
                      'No employees found matching your criteria.',
                      style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                        color: Theme.of(context).colorScheme.onBackground.withOpacity(0.6),
                      ),
                    ),
                  )
                : GridView.builder(
                    padding: const EdgeInsets.all(16),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      childAspectRatio: 0.8,
                      crossAxisSpacing: 16,
                      mainAxisSpacing: 16,
                    ),
                    itemCount: filteredEmployees.length,
                    itemBuilder: (context, index) {
                      final employee = filteredEmployees[index];
                      return EmployeeCard(
                        employee: employee,
                        onTap: () {
                          context.push('/employees/${employee.id}');
                        },
                      );
                    },
                  ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          _showAddEmployeeDialog(context);
        },
        child: const Icon(Icons.add),
      ),
    );
  }
  
  void _showFilterBottomSheet(BuildContext context, List<String> departments) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setState) {
            return Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Filter Employees',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 16),
                  
                  // Department filter
                  Text(
                    'Department',
                    style: Theme.of(context).textTheme.titleSmall,
                  ),
                  const SizedBox(height: 8),
                  DropdownButtonFormField<String>(
                    value: departmentFilter,
                    decoration: InputDecoration(
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16),
                    ),
                    items: [
                      const DropdownMenuItem(
                        value: 'all',
                        child: Text('All Departments'),
                      ),
                      ...departments.map((dept) => DropdownMenuItem(
                        value: dept,
                        child: Text(dept),
                      )),
                    ],
                    onChanged: (value) {
                      if (value != null) {
                        setState(() {
                          departmentFilter = value;
                        });
                        this.setState(() {
                          departmentFilter = value;
                        });
                      }
                    },
                  ),
                  const SizedBox(height: 16),
                  
                  // Status filter
                  Text(
                    'Status',
                    style: Theme.of(context).textTheme.titleSmall,
                  ),
                  const SizedBox(height: 8),
                  DropdownButtonFormField<String>(
                    value: statusFilter,
                    decoration: InputDecoration(
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16),
                    ),
                    items: const [
                      DropdownMenuItem(
                        value: 'all',
                        child: Text('All Status'),
                      ),
                      DropdownMenuItem(
                        value: 'Active',
                        child: Text('Active'),
                      ),
                      DropdownMenuItem(
                        value: 'On Leave',
                        child: Text('On Leave'),
                      ),
                      DropdownMenuItem(
                        value: 'Inactive',
                        child: Text('Inactive'),
                      ),
                    ],
                    onChanged: (value) {
                      if (value != null) {
                        setState(() {
                          statusFilter = value;
                        });
                        this.setState(() {
                          statusFilter = value;
                        });
                      }
                    },
                  ),
                  const SizedBox(height: 24),
                  
                  // Apply button
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.pop(context);
                      },
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const Text('Apply Filters'),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }
  
  void _showAddEmployeeDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => const EmployeeFormDialog(),
    );
  }
}