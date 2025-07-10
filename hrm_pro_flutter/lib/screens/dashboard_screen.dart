import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:hrm_pro_flutter/providers/auth_provider.dart';
import 'package:hrm_pro_flutter/utils/constants.dart';
import 'package:hrm_pro_flutter/widgets/dashboard_card.dart';
import 'package:hrm_pro_flutter/widgets/employee_birthday_card.dart';
import 'package:hrm_pro_flutter/widgets/event_card.dart';
import 'package:intl/intl.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentUser = ref.watch(currentUserProvider);
    final today = DateTime.now();
    final formatter = DateFormat('EEEE, MMMM d, yyyy');
    
    // Quick actions
    final quickActions = [
      {
        'title': 'Chat',
        'description': 'Start a conversation',
        'icon': Icons.chat_outlined,
        'route': '/chat',
        'color': Colors.blue,
      },
      {
        'title': 'Calendar',
        'description': 'View schedule',
        'icon': Icons.calendar_today_outlined,
        'route': '/scheduling',
        'color': Colors.green,
      },
      {
        'title': 'Tasks',
        'description': 'Manage tasks',
        'icon': Icons.check_box_outlined,
        'route': '/tasks',
        'color': Colors.purple,
      },
    ];
    
    // Upcoming events
    final upcomingEvents = [
      {
        'id': 1,
        'title': 'All Hands Meeting',
        'date': 'Today, 2:00 PM',
        'type': 'meeting',
      },
      {
        'id': 2,
        'title': 'New Employee Orientation',
        'date': 'Tomorrow, 9:00 AM',
        'type': 'orientation',
      },
      {
        'id': 3,
        'title': 'Performance Review Deadline',
        'date': 'Jul 15, 2025',
        'type': 'deadline',
      },
    ];
    
    // Employee birthdays
    final employeeBirthdays = [
      {
        'id': 1,
        'name': 'Sarah Chen',
        'position': 'Senior Software Engineer',
        'avatar': 'https://images.unsplash.com/photo-1494790108755-2616b25d0a63?w=150&h=150&fit=crop&crop=face',
        'date': 'Today',
        'isToday': true,
      },
      {
        'id': 2,
        'name': 'Michael Rodriguez',
        'position': 'Product Manager',
        'avatar': 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        'date': 'Tomorrow',
        'isToday': false,
      },
    ];
    
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Welcome section
              Text(
                'Welcome back, ${currentUser?.name.split(' ').first ?? 'User'}!',
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                formatter.format(today),
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: Theme.of(context).colorScheme.onBackground.withOpacity(0.6),
                ),
              ),
              const SizedBox(height: 24),
              
              // Quick actions
              Text(
                'Quick Actions',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 16),
              GridView.count(
                crossAxisCount: 3,
                crossAxisSpacing: 16,
                mainAxisSpacing: 16,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                children: quickActions.map((action) {
                  return DashboardCard(
                    title: action['title'] as String,
                    description: action['description'] as String,
                    icon: action['icon'] as IconData,
                    color: action['color'] as Color,
                    onTap: () {
                      context.push(action['route'] as String);
                    },
                  );
                }).toList(),
              ),
              const SizedBox(height: 24),
              
              // Main content
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Upcoming events
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Upcoming Events',
                          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 16),
                        Card(
                          elevation: 2,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                for (final event in upcomingEvents)
                                  EventCard(
                                    title: event['title'] as String,
                                    date: event['date'] as String,
                                    type: event['type'] as String,
                                  ),
                                const SizedBox(height: 16),
                                SizedBox(
                                  width: double.infinity,
                                  child: OutlinedButton(
                                    onPressed: () {
                                      context.push('/scheduling');
                                    },
                                    child: const Text('View All Events'),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 16),
                  // Employee birthdays
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Employee Birthdays',
                          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 16),
                        Card(
                          elevation: 2,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                if (employeeBirthdays.isNotEmpty)
                                  for (final birthday in employeeBirthdays)
                                    EmployeeBirthdayCard(
                                      name: birthday['name'] as String,
                                      position: birthday['position'] as String,
                                      avatar: birthday['avatar'] as String,
                                      date: birthday['date'] as String,
                                      isToday: birthday['isToday'] as bool,
                                    )
                                else
                                  Center(
                                    child: Padding(
                                      padding: const EdgeInsets.symmetric(vertical: 32),
                                      child: Column(
                                        children: [
                                          Icon(
                                            Icons.cake_outlined,
                                            size: 48,
                                            color: Theme.of(context).colorScheme.onSurface.withOpacity(0.3),
                                          ),
                                          const SizedBox(height: 16),
                                          Text(
                                            'No birthdays today or tomorrow',
                                            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                                              color: Theme.of(context).colorScheme.onSurface.withOpacity(0.6),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}