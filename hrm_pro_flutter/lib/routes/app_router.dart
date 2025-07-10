import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:hrm_pro_flutter/providers/auth_provider.dart';
import 'package:hrm_pro_flutter/screens/ai_assistant_screen.dart';
import 'package:hrm_pro_flutter/screens/analytics_screen.dart';
import 'package:hrm_pro_flutter/screens/attendance_screen.dart';
import 'package:hrm_pro_flutter/screens/chat_screen.dart';
import 'package:hrm_pro_flutter/screens/dashboard_screen.dart';
import 'package:hrm_pro_flutter/screens/documentation_screen.dart';
import 'package:hrm_pro_flutter/screens/employee_detail_screen.dart';
import 'package:hrm_pro_flutter/screens/employees_screen.dart';
import 'package:hrm_pro_flutter/screens/login_screen.dart';
import 'package:hrm_pro_flutter/screens/not_found_screen.dart';
import 'package:hrm_pro_flutter/screens/organizations_screen.dart';
import 'package:hrm_pro_flutter/screens/profile_screen.dart';
import 'package:hrm_pro_flutter/screens/projects_screen.dart';
import 'package:hrm_pro_flutter/screens/project_detail_screen.dart';
import 'package:hrm_pro_flutter/screens/shooting_request_screen.dart';
import 'package:hrm_pro_flutter/screens/recruitment_screen.dart';
import 'package:hrm_pro_flutter/screens/scheduling_screen.dart';
import 'package:hrm_pro_flutter/screens/settings_screen.dart';
import 'package:hrm_pro_flutter/screens/tasks_screen.dart';
import 'package:hrm_pro_flutter/screens/user_management_screen.dart';
import 'package:hrm_pro_flutter/widgets/app_scaffold.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authProvider);
  
  return GoRouter(
    initialLocation: '/',
    redirect: (context, state) {
      final isLoggedIn = authState.isAuthenticated;
      final isLoginRoute = state.matchedLocation == '/login';
      
      // If not logged in and not on login page, redirect to login
      if (!isLoggedIn && !isLoginRoute) {
        return '/login';
      }
      
      // If logged in and on login page, redirect to dashboard
      if (isLoggedIn && isLoginRoute) {
        return '/';
      }
      
      // No redirect needed
      return null;
    },
    errorBuilder: (context, state) => const NotFoundScreen(),
    routes: [
      // Auth routes
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      
      // App routes (wrapped in AppScaffold)
      ShellRoute(
        builder: (context, state, child) => AppScaffold(child: child),
        routes: [
          // Dashboard
          GoRoute(
            path: '/',
            builder: (context, state) => const DashboardScreen(),
          ),
          
          // Employees
          GoRoute(
            path: '/employees',
            builder: (context, state) => const EmployeesScreen(),
            routes: [
              GoRoute(
                path: ':id',
                builder: (context, state) {
                  final employeeId = state.pathParameters['id']!;
                  return EmployeeDetailScreen(employeeId: employeeId);
                },
              ),
            ],
          ),
          
          // Projects
          GoRoute(
            path: '/projects',
            builder: (context, state) => const ProjectsScreen(),
            routes: [
              GoRoute(
                path: ':id',
                builder: (context, state) {
                  final projectId = state.pathParameters['id']!;
                  return ProjectDetailScreen(projectId: projectId);
                },
              ),
            ],
          ),
          
          // Tasks
          GoRoute(
            path: '/tasks',
            builder: (context, state) => const TasksScreen(),
          ),
          
          // Shooting Requests
          GoRoute(
            path: '/shooting-requests',
            builder: (context, state) => const ShootingRequestScreen(),
          ),
          
          // Recruitment
          GoRoute(
            path: '/recruitment',
            builder: (context, state) => const RecruitmentScreen(),
          ),
          
          // Attendance
          GoRoute(
            path: '/attendance',
            builder: (context, state) => const AttendanceScreen(),
          ),
          
          // Scheduling
          GoRoute(
            path: '/scheduling',
            builder: (context, state) => const SchedulingScreen(),
          ),
          
          // Analytics
          GoRoute(
            path: '/analytics',
            builder: (context, state) => const AnalyticsScreen(),
          ),
          
          // Organizations
          GoRoute(
            path: '/organizations',
            builder: (context, state) => const OrganizationsScreen(),
          ),
          
          // Chat
          GoRoute(
            path: '/chat',
            builder: (context, state) => const ChatScreen(),
          ),
          
          // AI Assistant
          GoRoute(
            path: '/ai-assistant',
            builder: (context, state) => const AIAssistantScreen(),
          ),
          
          // Documentation
          GoRoute(
            path: '/documentation',
            builder: (context, state) => const DocumentationScreen(),
          ),
          
          // User Management
          GoRoute(
            path: '/user-management',
            builder: (context, state) => const UserManagementScreen(),
          ),
          
          // Profile
          GoRoute(
            path: '/profile',
            builder: (context, state) => const ProfileScreen(),
          ),
          
          // Settings
          GoRoute(
            path: '/settings',
            builder: (context, state) => const SettingsScreen(),
          ),
        ],
      ),
    ],
  );
});