import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hrm_pro_flutter/models/user.dart';
import 'package:hrm_pro_flutter/providers/auth_provider.dart';
import 'package:hrm_pro_flutter/utils/constants.dart';
import 'package:intl/intl.dart';

class UserManagementScreen extends ConsumerStatefulWidget {
  const UserManagementScreen({super.key});

  @override
  ConsumerState<UserManagementScreen> createState() => _UserManagementScreenState();
}

class _UserManagementScreenState extends ConsumerState<UserManagementScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();
  
  String _selectedRole = 'HR';
  String _selectedJobPosition = 'Reporter';
  String _selectedDepartment = 'HR';
  String _selectedOrganization = 'MediaTech Solutions';
  
  List<String> _selectedSections = [];
  List<String> _selectedAccessRules = [];
  
  bool _isAddUserDialogOpen = false;
  User? _selectedUser;
  
  // All available sections
  final List<String> _allSections = [
    'Dashboard',
    'AI Assistant', 
    'Employees',
    'Projects',
    'Recruitment',
    'Tasks',
    'Shooting Requests',
    'Scheduling',
    'Attendance',
    'Analytics',
    'Organizations',
    'Chat',
    'User Management',
    'Access Control',
    'Documentation',
    'Security System',
    'Settings'
  ];
  
  // Access control rules
  final List<Map<String, dynamic>> _accessRules = [
    {
      'id': '1',
      'name': 'Office IP Only',
      'description': 'Allow access only from office IP addresses',
    },
    {
      'id': '2',
      'name': 'Business Hours Only',
      'description': 'Restrict access to business hours only',
    },
    {
      'id': '3',
      'name': 'Secure Location Access',
      'description': 'Allow access only from specific geographic locations',
    },
    {
      'id': '4',
      'name': 'Trusted Devices Only',
      'description': 'Allow access only from registered devices',
    }
  ];
  
  // Role-based default sections
  final Map<String, List<String>> _roleDefaultSections = {
    'Admin': [
      'Dashboard',
      'AI Assistant', 
      'Employees',
      'Projects',
      'Recruitment',
      'Tasks',
      'Shooting Requests',
      'Scheduling',
      'Attendance',
      'Analytics',
      'Organizations',
      'Chat',
      'User Management',
      'Access Control',
      'Documentation',
      'Security System',
      'Settings'
    ],
    'HR': [
      'Dashboard',
      'AI Assistant',
      'Employees', 
      'Projects',
      'Recruitment',
      'Tasks',
      'Shooting Requests',
      'Scheduling',
      'Attendance',
      'Analytics',
      'Organizations',
      'Chat',
      'Documentation',
      'Settings'
    ],
    'Guest': ['Chat'],
    'Employee': ['Dashboard', 'Chat', 'Organizations', 'Shooting Requests', 'Scheduling', 'Documentation']
  };
  
  // Job positions
  final List<String> _jobPositions = [
    'Reporter',
    'Admin',
    'Driver',
    'Equipment Department',
    'Initiator',
    'Employee',
    'Head of Reporters'
  ];
  
  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _usernameController.dispose();
    _passwordController.dispose();
    super.dispose();
  }
  
  void _resetForm() {
    _nameController.clear();
    _emailController.clear();
    _phoneController.clear();
    _usernameController.clear();
    _passwordController.clear();
    _selectedRole = 'HR';
    _selectedJobPosition = 'Reporter';
    _selectedDepartment = 'HR';
    _selectedOrganization = 'MediaTech Solutions';
    _selectedSections = [];
    _selectedAccessRules = [];
  }
  
  void _showAddUserDialog() {
    _resetForm();
    _selectedUser = null;
    
    // Set default sections based on role
    _selectedSections = List.from(_roleDefaultSections[_selectedRole] ?? []);
    
    setState(() {
      _isAddUserDialogOpen = true;
    });
  }
  
  void _handleRoleChange(String? role) {
    if (role != null) {
      setState(() {
        _selectedRole = role;
        // Update sections based on role
        _selectedSections = List.from(_roleDefaultSections[role] ?? []);
      });
    }
  }
  
  void _toggleSection(String section) {
    setState(() {
      if (_selectedSections.contains(section)) {
        _selectedSections.remove(section);
      } else {
        _selectedSections.add(section);
      }
    });
  }
  
  void _toggleAccessRule(String ruleId) {
    setState(() {
      if (_selectedAccessRules.contains(ruleId)) {
        _selectedAccessRules.remove(ruleId);
      } else {
        _selectedAccessRules.add(ruleId);
      }
    });
  }
  
  void _saveUser() {
    if (_formKey.currentState!.validate()) {
      // In a real app, this would save to a database
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(_selectedUser == null ? 'User created successfully' : 'User updated successfully'),
          backgroundColor: Colors.green,
        ),
      );
      
      setState(() {
        _isAddUserDialogOpen = false;
      });
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('User Management'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Manage Users',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                ElevatedButton.icon(
                  onPressed: _showAddUserDialog,
                  icon: const Icon(Icons.add),
                  label: const Text('Add User'),
                ),
              ],
            ),
            const SizedBox(height: 16),
            
            // User list would go here
            const Expanded(
              child: Center(
                child: Text('User list would be displayed here'),
              ),
            ),
          ],
        ),
      ),
      
      // Add User Dialog
      bottomSheet: _isAddUserDialogOpen
          ? Container(
              height: MediaQuery.of(context).size.height * 0.9,
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(20),
                  topRight: Radius.circular(20),
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black26,
                    blurRadius: 10,
                    offset: Offset(0, -5),
                  ),
                ],
              ),
              child: Column(
                children: [
                  Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          _selectedUser == null ? 'Add New User' : 'Edit User',
                          style: const TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.close),
                          onPressed: () {
                            setState(() {
                              _isAddUserDialogOpen = false;
                            });
                          },
                        ),
                      ],
                    ),
                  ),
                  const Divider(),
                  Expanded(
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.all(16.0),
                      child: Form(
                        key: _formKey,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Basic Information
                            const Text(
                              'Basic Information',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 16),
                            
                            TextFormField(
                              controller: _nameController,
                              decoration: const InputDecoration(
                                labelText: 'Full Name',
                                border: OutlineInputBorder(),
                              ),
                              validator: (value) {
                                if (value == null || value.isEmpty) {
                                  return 'Please enter a name';
                                }
                                return null;
                              },
                            ),
                            const SizedBox(height: 16),
                            
                            TextFormField(
                              controller: _emailController,
                              decoration: const InputDecoration(
                                labelText: 'Email',
                                border: OutlineInputBorder(),
                              ),
                              validator: (value) {
                                if (value == null || value.isEmpty) {
                                  return 'Please enter an email';
                                }
                                if (!value.contains('@')) {
                                  return 'Please enter a valid email';
                                }
                                return null;
                              },
                            ),
                            const SizedBox(height: 16),
                            
                            TextFormField(
                              controller: _phoneController,
                              decoration: const InputDecoration(
                                labelText: 'Phone',
                                border: OutlineInputBorder(),
                              ),
                            ),
                            const SizedBox(height: 16),
                            
                            Row(
                              children: [
                                Expanded(
                                  child: DropdownButtonFormField<String>(
                                    decoration: const InputDecoration(
                                      labelText: 'Role',
                                      border: OutlineInputBorder(),
                                    ),
                                    value: _selectedRole,
                                    items: ['Admin', 'HR', 'Guest', 'Employee'].map((role) {
                                      return DropdownMenuItem<String>(
                                        value: role,
                                        child: Text(role),
                                      );
                                    }).toList(),
                                    onChanged: _handleRoleChange,
                                    validator: (value) {
                                      if (value == null || value.isEmpty) {
                                        return 'Please select a role';
                                      }
                                      return null;
                                    },
                                  ),
                                ),
                                const SizedBox(width: 16),
                                Expanded(
                                  child: DropdownButtonFormField<String>(
                                    decoration: const InputDecoration(
                                      labelText: 'Job Position',
                                      border: OutlineInputBorder(),
                                    ),
                                    value: _selectedJobPosition,
                                    items: _jobPositions.map((position) {
                                      return DropdownMenuItem<String>(
                                        value: position,
                                        child: Text(position),
                                      );
                                    }).toList(),
                                    onChanged: (value) {
                                      if (value != null) {
                                        setState(() {
                                          _selectedJobPosition = value;
                                        });
                                      }
                                    },
                                    validator: (value) {
                                      if (value == null || value.isEmpty) {
                                        return 'Please select a job position';
                                      }
                                      return null;
                                    },
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            
                            Row(
                              children: [
                                Expanded(
                                  child: DropdownButtonFormField<String>(
                                    decoration: const InputDecoration(
                                      labelText: 'Department',
                                      border: OutlineInputBorder(),
                                    ),
                                    value: _selectedDepartment,
                                    items: ['HR', 'Engineering', 'Design', 'Marketing', 'Sales', 'Finance'].map((dept) {
                                      return DropdownMenuItem<String>(
                                        value: dept,
                                        child: Text(dept),
                                      );
                                    }).toList(),
                                    onChanged: (value) {
                                      if (value != null) {
                                        setState(() {
                                          _selectedDepartment = value;
                                        });
                                      }
                                    },
                                  ),
                                ),
                                const SizedBox(width: 16),
                                Expanded(
                                  child: DropdownButtonFormField<String>(
                                    decoration: const InputDecoration(
                                      labelText: 'Organization',
                                      border: OutlineInputBorder(),
                                    ),
                                    value: _selectedOrganization,
                                    items: ['MediaTech Solutions', 'Creative Studios'].map((org) {
                                      return DropdownMenuItem<String>(
                                        value: org,
                                        child: Text(org),
                                      );
                                    }).toList(),
                                    onChanged: (value) {
                                      if (value != null) {
                                        setState(() {
                                          _selectedOrganization = value;
                                        });
                                      }
                                    },
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            
                            TextFormField(
                              controller: _usernameController,
                              decoration: const InputDecoration(
                                labelText: 'Username',
                                border: OutlineInputBorder(),
                              ),
                              validator: (value) {
                                if (value == null || value.isEmpty) {
                                  return 'Please enter a username';
                                }
                                return null;
                              },
                            ),
                            const SizedBox(height: 16),
                            
                            TextFormField(
                              controller: _passwordController,
                              decoration: const InputDecoration(
                                labelText: 'Password',
                                border: OutlineInputBorder(),
                              ),
                              obscureText: true,
                              validator: (value) {
                                if (_selectedUser == null && (value == null || value.isEmpty)) {
                                  return 'Please enter a password';
                                }
                                return null;
                              },
                            ),
                            const SizedBox(height: 24),
                            
                            // Section Access
                            const Text(
                              'Section Access',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 8),
                            const Text(
                              'Select which sections this user can access:',
                              style: TextStyle(
                                color: Colors.grey,
                              ),
                            ),
                            const SizedBox(height: 16),
                            
                            Wrap(
                              spacing: 8,
                              runSpacing: 8,
                              children: _allSections.map((section) {
                                final isSelected = _selectedSections.contains(section);
                                return FilterChip(
                                  label: Text(section),
                                  selected: isSelected,
                                  onSelected: (selected) {
                                    _toggleSection(section);
                                  },
                                  backgroundColor: Colors.grey.shade200,
                                  selectedColor: Colors.blue.shade100,
                                  checkmarkColor: Colors.blue,
                                );
                              }).toList(),
                            ),
                            const SizedBox(height: 24),
                            
                            // Access Control Rules
                            const Text(
                              'Access Control Rules',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 8),
                            const Text(
                              'Apply access control rules to this user:',
                              style: TextStyle(
                                color: Colors.grey,
                              ),
                            ),
                            const SizedBox(height: 16),
                            
                            ..._accessRules.map((rule) {
                              return CheckboxListTile(
                                title: Text(rule['name']),
                                subtitle: Text(rule['description']),
                                value: _selectedAccessRules.contains(rule['id']),
                                onChanged: (selected) {
                                  _toggleAccessRule(rule['id']);
                                },
                                contentPadding: EdgeInsets.zero,
                              );
                            }).toList(),
                            
                            const SizedBox(height: 24),
                            
                            // Save Button
                            SizedBox(
                              width: double.infinity,
                              child: ElevatedButton(
                                onPressed: _saveUser,
                                style: ElevatedButton.styleFrom(
                                  padding: const EdgeInsets.symmetric(vertical: 16),
                                ),
                                child: Text(
                                  _selectedUser == null ? 'Create User' : 'Update User',
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            )
          : null,
    );
  }
}