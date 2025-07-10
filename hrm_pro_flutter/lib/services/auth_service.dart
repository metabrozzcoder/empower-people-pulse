import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hrm_pro_flutter/models/user.dart';
import 'package:hrm_pro_flutter/services/api_service.dart';

class AuthService {
  final ApiService _apiService;

  AuthService(this._apiService);

  Future<User?> login(String username, String password) async {
    try {
      // For demo purposes, we'll use mock data
      if (username == 'admin' && password == 'admin') {
        return User(
          id: '0001',
          name: 'Sarah Wilson',
          email: 'sarah.wilson@company.com',
          phone: '+1 (555) 123-4567',
          role: 'Admin',
          jobPosition: 'Admin',
          status: 'Active',
          department: 'HR',
          organization: 'MediaTech Solutions',
          lastLogin: DateTime.now().toString(),
          createdDate: '2023-01-15',
          updatedDate: DateTime.now().toString(),
          permissions: ['full_access', 'user_management', 'system_settings'],
          username: 'admin',
        );
      } else if (username == 'john.smith' && password == 'hr123') {
        return User(
          id: '0002',
          name: 'John Smith',
          email: 'john.smith@company.com',
          phone: '+1 (555) 234-5678',
          role: 'HR',
          jobPosition: 'Reporter',
          status: 'Active',
          department: 'HR',
          organization: 'MediaTech Solutions',
          lastLogin: DateTime.now().toString(),
          createdDate: '2023-02-01',
          updatedDate: DateTime.now().toString(),
          permissions: ['employee_management', 'recruitment', 'performance_review'],
          username: 'john.smith',
        );
      } else if (username == 'abd' && password == 'guest123') {
        return User(
          id: '0003',
          name: 'Abd Rahman',
          email: 'abd@company.com',
          phone: '+1 (555) 345-6789',
          role: 'Guest',
          jobPosition: 'Initiator',
          status: 'Active',
          department: 'Guest',
          organization: 'MediaTech Solutions',
          lastLogin: DateTime.now().toString(),
          createdDate: '2023-03-01',
          updatedDate: DateTime.now().toString(),
          permissions: ['limited_access'],
          username: 'abd',
          jobPosition: 'Employee',
        );
      }
      
      // In a real app, we would call the API
      // final response = await _apiService.post('/auth/login', data: {
      //   'username': username,
      //   'password': password,
      // });
      
      // return User.fromJson(response.data['user']);
      
      return null;
    } catch (e) {
      rethrow;
    }
  }

  Future<void> logout() async {
    try {
      // In a real app, we would call the API
      // await _apiService.post('/auth/logout');
    } catch (e) {
      rethrow;
    }
  }
}

final authServiceProvider = Provider<AuthService>((ref) {
  final apiService = ref.watch(apiServiceProvider);
  return AuthService(apiService);
});