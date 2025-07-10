import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hrm_pro_flutter/models/employee.dart';
import 'package:hrm_pro_flutter/providers/employees_provider.dart';
import 'package:hrm_pro_flutter/utils/constants.dart';
import 'package:intl/intl.dart';

class EmployeeFormDialog extends ConsumerStatefulWidget {
  final Employee? employee;

  const EmployeeFormDialog({
    super.key,
    this.employee,
  });

  @override
  ConsumerState<EmployeeFormDialog> createState() => _EmployeeFormDialogState();
}

class _EmployeeFormDialogState extends ConsumerState<EmployeeFormDialog> {
  final _formKey = GlobalKey<FormState>();
  
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _positionController = TextEditingController();
  final _salaryController = TextEditingController();
  final _locationController = TextEditingController();
  
  String _department = '';
  String _manager = '';
  DateTime _hireDate = DateTime.now();
  
  @override
  void initState() {
    super.initState();
    
    if (widget.employee != null) {
      final nameParts = widget.employee!.name.split(' ');
      _firstNameController.text = nameParts.first;
      _lastNameController.text = nameParts.length > 1 ? nameParts.sublist(1).join(' ') : '';
      _emailController.text = widget.employee!.email;
      _phoneController.text = widget.employee!.phone;
      _positionController.text = widget.employee!.position;
      _salaryController.text = widget.employee!.salary.toString();
      _locationController.text = widget.employee!.location;
      _department = widget.employee!.department;
      _manager = widget.employee!.manager ?? '';
      _hireDate = DateTime.parse(widget.employee!.hireDate);
    }
  }
  
  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _positionController.dispose();
    _salaryController.dispose();
    _locationController.dispose();
    super.dispose();
  }
  
  Future<void> _selectDate(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _hireDate,
      firstDate: DateTime(2000),
      lastDate: DateTime(2101),
    );
    if (picked != null && picked != _hireDate) {
      setState(() {
        _hireDate = picked;
      });
    }
  }
  
  void _saveEmployee() {
    if (!_formKey.currentState!.validate()) return;
    
    final firstName = _firstNameController.text.trim();
    final lastName = _lastNameController.text.trim();
    final fullName = '$firstName $lastName';
    
    if (widget.employee == null) {
      // Create new employee
      final newEmployee = Employee(
        id: DateTime.now().millisecondsSinceEpoch,
        name: fullName,
        email: _emailController.text.trim(),
        position: _positionController.text.trim(),
        department: _department,
        hireDate: DateFormat('yyyy-MM-dd').format(_hireDate),
        birthday: '2025-07-08', // Default placeholder
        salary: int.tryParse(_salaryController.text) ?? 50000,
        status: 'Active',
        phone: _phoneController.text.trim(),
        location: _locationController.text.trim(),
        manager: _manager.isEmpty ? null : _manager,
        performanceScore: 85, // Default score for new employees
      );
      
      ref.read(employeesProvider.notifier).addEmployee(newEmployee);
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('${newEmployee.name} has been added successfully.'),
          backgroundColor: Colors.green,
        ),
      );
    } else {
      // Update existing employee
      final updatedEmployee = Employee(
        id: widget.employee!.id,
        name: fullName,
        email: _emailController.text.trim(),
        position: _positionController.text.trim(),
        department: _department,
        hireDate: DateFormat('yyyy-MM-dd').format(_hireDate),
        birthday: widget.employee!.birthday,
        salary: int.tryParse(_salaryController.text) ?? widget.employee!.salary,
        status: widget.employee!.status,
        avatar: widget.employee!.avatar,
        phone: _phoneController.text.trim(),
        location: _locationController.text.trim(),
        manager: _manager.isEmpty ? null : _manager,
        performanceScore: widget.employee!.performanceScore,
      );
      
      ref.read(employeesProvider.notifier).updateEmployee(updatedEmployee);
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('${updatedEmployee.name} has been updated successfully.'),
          backgroundColor: Colors.green,
        ),
      );
    }
    
    Navigator.pop(context);
  }
  
  @override
  Widget build(BuildContext context) {
    final departments = ref.watch(departmentsProvider);
    final managers = ref.watch(managersProvider);
    
    return AlertDialog(
      title: Text(widget.employee == null ? 'Add New Employee' : 'Edit Employee'),
      content: SizedBox(
        width: 600,
        child: Form(
          key: _formKey,
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // First row
                Row(
                  children: [
                    Expanded(
                      child: TextFormField(
                        controller: _firstNameController,
                        decoration: const InputDecoration(
                          labelText: 'First Name *',
                          border: OutlineInputBorder(),
                        ),
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Please enter first name';
                          }
                          return null;
                        },
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: TextFormField(
                        controller: _lastNameController,
                        decoration: const InputDecoration(
                          labelText: 'Last Name *',
                          border: OutlineInputBorder(),
                        ),
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Please enter last name';
                          }
                          return null;
                        },
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                
                // Second row
                Row(
                  children: [
                    Expanded(
                      child: TextFormField(
                        controller: _emailController,
                        decoration: const InputDecoration(
                          labelText: 'Email *',
                          border: OutlineInputBorder(),
                        ),
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Please enter email';
                          }
                          if (!value.contains('@')) {
                            return 'Please enter a valid email';
                          }
                          return null;
                        },
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: TextFormField(
                        controller: _phoneController,
                        decoration: const InputDecoration(
                          labelText: 'Phone',
                          border: OutlineInputBorder(),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                
                // Third row
                Row(
                  children: [
                    Expanded(
                      child: TextFormField(
                        controller: _positionController,
                        decoration: const InputDecoration(
                          labelText: 'Position *',
                          border: OutlineInputBorder(),
                        ),
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Please enter position';
                          }
                          return null;
                        },
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: DropdownButtonFormField<String>(
                        value: _department.isEmpty ? null : _department,
                        decoration: const InputDecoration(
                          labelText: 'Department',
                          border: OutlineInputBorder(),
                        ),
                        items: departments.map((dept) => DropdownMenuItem(
                          value: dept,
                          child: Text(dept),
                        )).toList(),
                        onChanged: (value) {
                          if (value != null) {
                            setState(() {
                              _department = value;
                            });
                          }
                        },
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                
                // Fourth row
                Row(
                  children: [
                    Expanded(
                      child: TextFormField(
                        controller: _salaryController,
                        decoration: const InputDecoration(
                          labelText: 'Salary',
                          border: OutlineInputBorder(),
                        ),
                        keyboardType: TextInputType.number,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: InkWell(
                        onTap: () => _selectDate(context),
                        child: InputDecorator(
                          decoration: const InputDecoration(
                            labelText: 'Hire Date',
                            border: OutlineInputBorder(),
                          ),
                          child: Text(
                            DateFormat('yyyy-MM-dd').format(_hireDate),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                
                // Fifth row
                Row(
                  children: [
                    Expanded(
                      child: TextFormField(
                        controller: _locationController,
                        decoration: const InputDecoration(
                          labelText: 'Location',
                          border: OutlineInputBorder(),
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: DropdownButtonFormField<String>(
                        value: _manager.isEmpty ? null : _manager,
                        decoration: const InputDecoration(
                          labelText: 'Manager',
                          border: OutlineInputBorder(),
                        ),
                        items: [
                          const DropdownMenuItem(
                            value: '',
                            child: Text('None'),
                          ),
                          ...managers.map((manager) => DropdownMenuItem(
                            value: manager,
                            child: Text(manager),
                          )),
                        ],
                        onChanged: (value) {
                          setState(() {
                            _manager = value ?? '';
                          });
                        },
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: () {
            Navigator.pop(context);
          },
          child: const Text('Cancel'),
        ),
        ElevatedButton(
          onPressed: _saveEmployee,
          child: Text(widget.employee == null ? 'Create' : 'Update'),
        ),
      ],
    );
  }
}