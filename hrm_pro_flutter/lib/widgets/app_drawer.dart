import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:hrm_pro_flutter/providers/auth_provider.dart';
import 'package:hrm_pro_flutter/utils/constants.dart';

class DrawerItem {
  final String title;
  final IconData icon;
  final String route;
  final List<String> allowedRoles;
  final String? sectionName;

  const DrawerItem({
    required this.title,
    required this.icon,
    required this.route,
    this.allowedRoles = const ['Admin', 'HR', 'Guest'],
    this.sectionName,
  });
}

class DrawerSection {
  final String title;
  final List<DrawerItem> items;
  final bool collapsible;

  const DrawerSection({
    required this.title,
    required this.items,
    this.collapsible = true,
  });
}

class AppDrawer extends ConsumerWidget {
  const AppDrawer({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentUser = ref.watch(currentUserProvider);
    final currentRoute = GoRouterState.of(context).matchedLocation;
    
    // Define drawer sections
    final drawerSections = [
      DrawerSection(
        title: 'Main Menu',
        collapsible: false,
        items: [
          const DrawerItem(
            title: 'Dashboard',
            icon: Icons.dashboard_outlined,
            route: '/',
            sectionName: 'Dashboard',
          ),
          const DrawerItem(
            title: 'AI Assistant',
            icon: Icons.psychology_outlined,
            route: '/ai-assistant',
            sectionName: 'AI Assistant',
          ),
        ],
      ),
      DrawerSection(
        title: 'HR & Projects',
        items: [
          const DrawerItem(
            title: 'Employees',
            icon: Icons.people_outline,
            route: '/employees',
            sectionName: 'Employees',
          ),
          const DrawerItem(
            title: 'Recruitment',
            icon: Icons.person_add_outlined,
            route: '/recruitment',
            sectionName: 'Recruitment',
          ),
          const DrawerItem(
            title: 'Scheduling',
            icon: Icons.calendar_today_outlined,
            route: '/scheduling',
            sectionName: 'Scheduling',
          ),
          const DrawerItem(
            title: 'Projects',
            icon: Icons.work_outline,
            route: '/projects',
            sectionName: 'Projects',
          ),
          const DrawerItem(
            title: 'Tasks',
            icon: Icons.check_box_outlined,
            route: '/tasks',
            sectionName: 'Tasks',
          ),
          const DrawerItem(
            title: 'Shooting Requests',
            icon: Icons.videocam_outlined,
            route: '/tasks',
            sectionName: 'Tasks',
          ),
        ],
      ),
      DrawerSection(
        title: 'Organization',
        items: [
          const DrawerItem(
            title: 'Organizations',
            icon: Icons.business_outlined,
            route: '/organizations',
            sectionName: 'Organizations',
          ),
        ],
      ),
      DrawerSection(
        title: 'Communication',
        items: [
          const DrawerItem(
            title: 'Chat',
            icon: Icons.chat_outlined,
            route: '/chat',
            sectionName: 'Chat',
          ),
        ],
      ),
      DrawerSection(
        title: 'Management & Analytics',
        items: [
          const DrawerItem(
            title: 'User Management',
            icon: Icons.manage_accounts_outlined,
            route: '/user-management',
            sectionName: 'User Management',
            allowedRoles: ['Admin'],
          ),
          const DrawerItem(
            title: 'Analytics',
            icon: Icons.bar_chart_outlined,
            route: '/analytics',
            sectionName: 'Analytics',
          ),
        ],
      ),
      DrawerSection(
        title: 'Documentation',
        items: [
          const DrawerItem(
            title: 'Documentation',
            icon: Icons.description_outlined,
            route: '/documentation',
            sectionName: 'Documentation',
          ),
        ],
      ),
    ];

    // Filter items based on user role and permissions
    List<DrawerSection> filteredSections = drawerSections.map((section) {
      final filteredItems = section.items.where((item) {
        // Check role-based access
        if (!item.allowedRoles.contains(currentUser?.role)) {
          return false;
        }
        
        // Check section access for Guest users
        if (currentUser?.role == 'Guest') {
          if (currentUser?.allowedSections != null && currentUser!.allowedSections!.isNotEmpty) {
            return item.sectionName == null || currentUser.allowedSections!.contains(item.sectionName);
          }
          // Default Guest behavior: only Chat
          return item.sectionName == 'Chat';
        }
        
        // Check section restrictions
        if (item.sectionName != null && 
            currentUser?.sectionAccess != null && 
            currentUser!.sectionAccess!.contains(item.sectionName)) {
          return false;
        }
        
        return true;
      }).toList();
      
      return DrawerSection(
        title: section.title,
        items: filteredItems,
        collapsible: section.collapsible,
      );
    }).where((section) => section.items.isNotEmpty).toList();

    return Drawer(
      child: Column(
        children: [
          DrawerHeader(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  Theme.of(context).colorScheme.primary,
                  Theme.of(context).colorScheme.primary.withOpacity(0.8),
                ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
            child: Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.background,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(
                    Icons.people,
                    color: Theme.of(context).colorScheme.primary,
                  ),
                ),
                const SizedBox(width: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      'MediaHR Pro',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        color: Theme.of(context).colorScheme.onPrimary,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      'AI-Enhanced HRM',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Theme.of(context).colorScheme.onPrimary.withOpacity(0.8),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          Expanded(
            child: ListView(
              padding: EdgeInsets.zero,
              children: [
                for (final section in filteredSections) ...[
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                    child: Text(
                      section.title,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: Theme.of(context).colorScheme.primary,
                      ),
                    ),
                  ),
                  for (final item in section.items)
                    ListTile(
                      leading: Icon(
                        item.icon,
                        color: currentRoute == item.route
                            ? Theme.of(context).colorScheme.primary
                            : null,
                      ),
                      title: Text(
                        item.title,
                        style: TextStyle(
                          fontWeight: currentRoute == item.route
                              ? FontWeight.bold
                              : FontWeight.normal,
                        ),
                      ),
                      selected: currentRoute == item.route,
                      selectedTileColor: Theme.of(context).colorScheme.primaryContainer.withOpacity(0.3),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                      onTap: () {
                        context.go(item.route);
                        Navigator.pop(context); // Close drawer
                      },
                    ),
                  const Divider(),
                ],
              ],
            ),
          ),
          // User info at bottom
          if (currentUser != null)
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surface,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 10,
                    offset: const Offset(0, -5),
                  ),
                ],
              ),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 20,
                    backgroundImage: currentUser.avatar != null
                        ? NetworkImage(currentUser.avatar!)
                        : null,
                    child: currentUser.avatar == null
                        ? Text(
                            currentUser.name.isNotEmpty
                                ? currentUser.name.substring(0, 1).toUpperCase()
                                : '?',
                            style: const TextStyle(fontWeight: FontWeight.bold),
                          )
                        : null,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          currentUser.name,
                          style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                        Row(
                          children: [
                            Icon(
                              Icons.shield_outlined,
                              size: 12,
                              color: Theme.of(context).colorScheme.secondary,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              currentUser.role,
                              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: Theme.of(context).colorScheme.secondary,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.logout_outlined, size: 20),
                    onPressed: () {
                      ref.read(authProvider.notifier).logout();
                    },
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}