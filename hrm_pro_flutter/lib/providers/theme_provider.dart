import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hrm_pro_flutter/services/storage_service.dart';

class ThemeNotifier extends StateNotifier<ThemeMode> {
  final StorageService _storageService;
  
  ThemeNotifier(this._storageService) : super(ThemeMode.system) {
    _initialize();
  }
  
  Future<void> _initialize() async {
    final savedTheme = await _storageService.getThemeMode();
    if (savedTheme != null) {
      state = savedTheme;
    }
  }
  
  Future<void> setThemeMode(ThemeMode themeMode) async {
    state = themeMode;
    await _storageService.saveThemeMode(themeMode);
  }
}

final themeProvider = StateNotifierProvider<ThemeNotifier, ThemeMode>((ref) {
  final storageService = ref.watch(storageServiceProvider);
  return ThemeNotifier(storageService);
});