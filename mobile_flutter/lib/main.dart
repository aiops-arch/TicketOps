import 'dart:convert';
import 'dart:io';
import 'dart:ui';

import 'package:flutter/material.dart';

const defaultApiBase = String.fromEnvironment(
  'TICKETOPS_API_BASE',
  defaultValue: 'https://ticketops-api.onrender.com',
);

void main() {
  runApp(const TicketOpsMobileApp());
}

class TicketOpsMobileApp extends StatelessWidget {
  const TicketOpsMobileApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'TicketOps',
      theme: ThemeData(
        useMaterial3: true,
        scaffoldBackgroundColor: AppColors.page,
        colorScheme: ColorScheme.fromSeed(
          seedColor: AppColors.accent,
          brightness: Brightness.light,
          surface: Colors.white,
        ),
        textTheme:
            const TextTheme(
              headlineLarge: TextStyle(
                fontWeight: FontWeight.w800,
                height: .95,
              ),
              headlineMedium: TextStyle(fontWeight: FontWeight.w800, height: 1),
              titleLarge: TextStyle(fontWeight: FontWeight.w800),
              titleMedium: TextStyle(fontWeight: FontWeight.w800),
              bodyMedium: TextStyle(height: 1.35),
            ).apply(
              bodyColor: AppColors.ink,
              displayColor: AppColors.ink,
              fontFamily: 'Roboto',
            ),
      ),
      home: const TicketOpsRoot(),
    );
  }
}

class AppColors {
  static const page = Color(0xFFEEF7F8);
  static const ink = Color(0xFF06121A);
  static const muted = Color(0xFF5C7178);
  static const accent = Color(0xFF4AC7E8);
  static const accentStrong = Color(0xFF16798F);
  static const teal = Color(0xFF147B74);
  static const danger = Color(0xFFB95650);
  static const warning = Color(0xFFB8892B);
}

class TicketOpsApi {
  TicketOpsApi(this.baseUrl);

  final String baseUrl;
  final HttpClient _http = HttpClient();

  Uri _uri(String path) => Uri.parse('$baseUrl$path');

  Future<Map<String, dynamic>> getJson(
    String path,
    Map<String, dynamic>? user,
  ) async {
    final request = await _http.getUrl(_uri(path));
    _addHeaders(request, user);
    return _readJson(await request.close());
  }

  Future<Map<String, dynamic>> postJson(
    String path,
    Map<String, dynamic>? body,
    Map<String, dynamic>? user,
  ) async {
    final request = await _http.postUrl(_uri(path));
    _addHeaders(request, user);
    request.headers.contentType = ContentType.json;
    request.write(jsonEncode(body ?? const {}));
    return _readJson(await request.close());
  }

  Future<Map<String, dynamic>> patchJson(
    String path,
    Map<String, dynamic>? body,
    Map<String, dynamic>? user,
  ) async {
    final request = await _http.patchUrl(_uri(path));
    _addHeaders(request, user);
    request.headers.contentType = ContentType.json;
    request.write(jsonEncode(body ?? const {}));
    return _readJson(await request.close());
  }

  void _addHeaders(HttpClientRequest request, Map<String, dynamic>? user) {
    request.headers.set(HttpHeaders.acceptHeader, 'application/json');
    if (user != null) {
      request.headers.set('X-TicketOps-User', '${user['id']}');
      request.headers.set('X-TicketOps-Role', '${user['role']}');
    }
  }

  Future<Map<String, dynamic>> _readJson(HttpClientResponse response) async {
    final text = await utf8.decodeStream(response);
    final decoded = text.isEmpty ? <String, dynamic>{} : jsonDecode(text);
    final body = decoded is Map<String, dynamic>
        ? decoded
        : <String, dynamic>{'data': decoded};
    if (response.statusCode >= 400) {
      throw Exception(
        body['error'] ?? 'Request failed (${response.statusCode})',
      );
    }
    return body;
  }
}

class TicketOpsRoot extends StatefulWidget {
  const TicketOpsRoot({super.key});

  @override
  State<TicketOpsRoot> createState() => _TicketOpsRootState();
}

class _TicketOpsRootState extends State<TicketOpsRoot> {
  late String apiBase = defaultApiBase;
  late TicketOpsApi api = TicketOpsApi(apiBase);
  Map<String, dynamic>? user;
  Map<String, dynamic>? data;
  List<dynamic> todayTasks = [];
  bool loading = false;
  String error = '';
  int tab = 0;

  Future<void> login(String username, String password, String endpoint) async {
    setState(() {
      loading = true;
      error = '';
      apiBase = endpoint.trim().isEmpty ? defaultApiBase : endpoint.trim();
      api = TicketOpsApi(apiBase);
    });

    try {
      final result = await api.postJson('/api/auth/login', {
        'username': username.trim(),
        'password': password,
      }, null);
      user = result['user'] as Map<String, dynamic>;
      await refresh();
    } catch (exception) {
      setState(() => error = cleanError(exception));
      throw Exception(cleanError(exception));
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  Future<void> refresh() async {
    if (user == null) return;
    final bootstrap = await api.getJson('/api/bootstrap', user);
    List<dynamic> tasks = bootstrap['tasks'] as List<dynamic>? ?? [];
    if (user?['role'] == 'technician') {
      final taskResult = await api.getJson('/api/technician/tasks/today', user);
      tasks = taskResult['data'] as List<dynamic>? ?? [];
    }
    setState(() {
      data = bootstrap;
      todayTasks = tasks;
    });
  }

  Future<void> markTaskDone(String id) async {
    if (user == null) return;
    setState(() => loading = true);
    try {
      await api.postJson('/api/technician/tasks/$id/status', {
        'status': 'done',
      }, user);
      await refresh();
    } catch (exception) {
      setState(() => error = cleanError(exception));
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  Future<void> advanceTicket(Map<String, dynamic> ticket) async {
    final next = nextTicketStatus('${ticket['status']}');
    if (next == null || user == null) return;
    setState(() => loading = true);
    try {
      await api.patchJson('/api/tickets/${ticket['id']}/status', {
        'status': next,
        'detail': 'Updated from mobile app',
      }, user);
      await refresh();
    } catch (exception) {
      setState(() => error = cleanError(exception));
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  Future<void> acceptTicket(Map<String, dynamic> ticket) async {
    if (user == null) return;
    setState(() => loading = true);
    try {
      await api.postJson('/api/tickets/${ticket['id']}/accept', {}, user);
      await refresh();
    } catch (exception) {
      setState(() => error = cleanError(exception));
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  Future<void> rejectTicket(Map<String, dynamic> ticket, String reason) async {
    if (user == null) return;
    setState(() => loading = true);
    try {
      await api.postJson('/api/tickets/${ticket['id']}/reject', {
        'reason': reason,
      }, user);
      await refresh();
    } catch (exception) {
      setState(() => error = cleanError(exception));
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  Future<void> assignTicket(
    Map<String, dynamic> ticket,
    String technicianId,
  ) async {
    if (user == null) return;
    setState(() => loading = true);
    try {
      await api.patchJson('/api/tickets/${ticket['id']}/assign', {
        'technicianId': technicianId,
      }, user);
      await refresh();
    } catch (exception) {
      setState(() => error = cleanError(exception));
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  Future<void> markAttendance(String status, String reason) async {
    if (user == null || user?['role'] != 'technician') return;
    final technicianId = '${user?['technicianId']}';
    if (technicianId.isEmpty || technicianId == 'null') return;
    final today = DateTime.now().toIso8601String().substring(0, 10);
    setState(() => loading = true);
    try {
      await api.postJson('/api/technicians/$technicianId/attendance', {
        'status': status,
        'from': today,
        'to': today,
        'reason': reason,
      }, user);
      await refresh();
    } catch (exception) {
      setState(() => error = cleanError(exception));
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  Future<void> changePassword(
    String currentPassword,
    String newPassword,
    String confirmPassword,
  ) async {
    if (user == null) return;
    setState(() {
      loading = true;
      error = '';
    });
    try {
      await api.postJson('/api/auth/change-password', {
        'currentPassword': currentPassword,
        'newPassword': newPassword,
        'confirmPassword': confirmPassword,
      }, user);
      setState(() {
        user = null;
        data = null;
        todayTasks = [];
        tab = 0;
        error = 'Password updated. Please sign in again.';
      });
    } catch (exception) {
      setState(() => error = cleanError(exception));
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AmbientScaffold(
      child: user == null
          ? LoginScreen(
              apiBase: apiBase,
              loading: loading,
              error: error,
              onLogin: login,
            )
          : HomeScreen(
              user: user!,
              data: data ?? const {},
              todayTasks: todayTasks,
              tab: tab,
              loading: loading,
              error: error,
              onTab: (value) => setState(() => tab = value),
              onRefresh: refresh,
              onLogout: () => setState(() {
                user = null;
                data = null;
                todayTasks = [];
                tab = 0;
                error = '';
              }),
              onTaskDone: markTaskDone,
              onTicketAdvance: advanceTicket,
              onTicketAccept: acceptTicket,
              onTicketReject: rejectTicket,
              onTicketAssign: assignTicket,
              onAttendance: markAttendance,
              onPasswordChange: changePassword,
            ),
    );
  }
}

class AmbientScaffold extends StatelessWidget {
  const AmbientScaffold({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  Color(0xFFECF8FA),
                  Color(0xFFFAFCFC),
                  Color(0xFFE4F4F3),
                ],
              ),
            ),
          ),
          const Positioned(
            top: -80,
            left: -40,
            child: GlowOrb(size: 220, color: Color(0x664AC7E8)),
          ),
          const Positioned(
            top: 120,
            right: -70,
            child: GlowOrb(size: 250, color: Color(0x55B7F1FF)),
          ),
          const Positioned(
            bottom: -80,
            left: 80,
            child: GlowOrb(size: 220, color: Color(0x33147B74)),
          ),
          child,
        ],
      ),
    );
  }
}

class GlowOrb extends StatelessWidget {
  const GlowOrb({super.key, required this.size, required this.color});

  final double size;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return ImageFiltered(
      imageFilter: ImageFilter.blur(sigmaX: 45, sigmaY: 45),
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(color: color, shape: BoxShape.circle),
      ),
    );
  }
}

class LoginScreen extends StatefulWidget {
  const LoginScreen({
    super.key,
    required this.apiBase,
    required this.loading,
    required this.error,
    required this.onLogin,
  });

  final String apiBase;
  final bool loading;
  final String error;
  final Future<void> Function(String username, String password, String endpoint)
  onLogin;

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  late final TextEditingController endpoint = TextEditingController(
    text: widget.apiBase,
  );
  final username = TextEditingController(text: 'aiops');
  final password = TextEditingController(text: 'AIops');

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 12),
              const Text(
                'TicketOps',
                style: TextStyle(
                  fontSize: 44,
                  fontWeight: FontWeight.w900,
                  height: .95,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Restaurant maintenance command for mobile teams.',
                style: TextStyle(color: AppColors.muted, fontSize: 16),
              ),
              const SizedBox(height: 26),
              GlassCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const SectionLabel('Secure access'),
                    const SizedBox(height: 12),
                    AppInput(controller: endpoint, label: 'API endpoint'),
                    const SizedBox(height: 12),
                    AppInput(controller: username, label: 'Username'),
                    const SizedBox(height: 12),
                    AppInput(
                      controller: password,
                      label: 'Password',
                      obscure: true,
                    ),
                    if (widget.error.isNotEmpty) ...[
                      const SizedBox(height: 12),
                      Text(
                        widget.error,
                        style: const TextStyle(
                          color: AppColors.danger,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                    const SizedBox(height: 18),
                    PrimaryButton(
                      label: widget.loading
                          ? 'Signing in...'
                          : 'Enter mobile command',
                      onPressed: widget.loading
                          ? null
                          : () => widget.onLogin(
                              username.text,
                              password.text,
                              endpoint.text,
                            ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  QuickLoginChip(
                    'Admin',
                    'aiops',
                    'AIops',
                    username,
                    password,
                  ),
                  QuickLoginChip(
                    'Manager',
                    'pratik.patel',
                    'pratik123',
                    username,
                    password,
                  ),
                  QuickLoginChip(
                    'Tech',
                    'rahul.patil',
                    'rahul123',
                    username,
                    password,
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

class QuickLoginChip extends StatelessWidget {
  const QuickLoginChip(
    this.label,
    this.user,
    this.pass,
    this.username,
    this.password, {
    super.key,
  });

  final String label;
  final String user;
  final String pass;
  final TextEditingController username;
  final TextEditingController password;

  @override
  Widget build(BuildContext context) {
    return ActionChip(
      label: Text(label),
      onPressed: () {
        username.text = user;
        password.text = pass;
      },
      backgroundColor: Colors.white.withValues(alpha: .55),
      side: BorderSide(color: AppColors.accent.withValues(alpha: .28)),
    );
  }
}

class HomeScreen extends StatelessWidget {
  const HomeScreen({
    super.key,
    required this.user,
    required this.data,
    required this.todayTasks,
    required this.tab,
    required this.loading,
    required this.error,
    required this.onTab,
    required this.onRefresh,
    required this.onLogout,
    required this.onTaskDone,
    required this.onTicketAdvance,
    required this.onTicketAccept,
    required this.onTicketReject,
    required this.onTicketAssign,
    required this.onAttendance,
    required this.onPasswordChange,
  });

  final Map<String, dynamic> user;
  final Map<String, dynamic> data;
  final List<dynamic> todayTasks;
  final int tab;
  final bool loading;
  final String error;
  final ValueChanged<int> onTab;
  final Future<void> Function() onRefresh;
  final VoidCallback onLogout;
  final Future<void> Function(String id) onTaskDone;
  final Future<void> Function(Map<String, dynamic> ticket) onTicketAdvance;
  final Future<void> Function(Map<String, dynamic> ticket) onTicketAccept;
  final Future<void> Function(Map<String, dynamic> ticket, String reason)
  onTicketReject;
  final Future<void> Function(Map<String, dynamic> ticket, String technicianId)
  onTicketAssign;
  final Future<void> Function(String status, String reason) onAttendance;
  final Future<void> Function(
    String currentPassword,
    String newPassword,
    String confirmPassword,
  )
  onPasswordChange;

  @override
  Widget build(BuildContext context) {
    final destinations = mobileDestinations(user);
    final pages = [
      DashboardPage(user: user, data: data, todayTasks: todayTasks),
      WorkPage(
        user: user,
        data: data,
        todayTasks: todayTasks,
        onTaskDone: onTaskDone,
      ),
      TicketPage(
        user: user,
        data: data,
        onTicketAdvance: onTicketAdvance,
        onTicketAccept: onTicketAccept,
        onTicketReject: onTicketReject,
        onTicketAssign: onTicketAssign,
      ),
      AccountPage(
        user: user,
        data: data,
        onLogout: onLogout,
        onAttendance: onAttendance,
        onPasswordChange: onPasswordChange,
      ),
    ];

    return SafeArea(
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 8),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SectionLabel('Mobile command'),
                      Text(
                        roleTitle(user),
                        style: const TextStyle(
                          fontSize: 27,
                          fontWeight: FontWeight.w900,
                          height: 1,
                        ),
                      ),
                    ],
                  ),
                ),
                IconButton.filledTonal(
                  onPressed: onRefresh,
                  icon: const Icon(Icons.refresh_rounded),
                ),
              ],
            ),
          ),
          if (loading) const LinearProgressIndicator(minHeight: 2),
          if (error.isNotEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Text(
                error,
                style: const TextStyle(
                  color: AppColors.danger,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          Expanded(
            child: RefreshIndicator(onRefresh: onRefresh, child: pages[tab]),
          ),
          NavigationBar(
            selectedIndex: tab,
            onDestinationSelected: onTab,
            backgroundColor: Colors.white.withValues(alpha: .72),
            indicatorColor: AppColors.accent.withValues(alpha: .22),
            destinations: destinations,
          ),
        ],
      ),
    );
  }
}

class DashboardPage extends StatelessWidget {
  const DashboardPage({
    super.key,
    required this.user,
    required this.data,
    required this.todayTasks,
  });

  final Map<String, dynamic> user;
  final Map<String, dynamic> data;
  final List<dynamic> todayTasks;

  @override
  Widget build(BuildContext context) {
    final reports = mapOf(data['reports']);
    final tickets = listOf(
      data['tickets'],
    ).where((ticket) => '${mapOf(ticket)['status']}' != 'Closed').toList();
    final tasks = todayTasks;
    final done = tasks.where((task) => isDone(mapOf(task))).length;
    final pending = tasks.length - done;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        RoleBriefCard(user: user),
        const SizedBox(height: 14),
        GlassCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SectionLabel('${user['post'] ?? 'TicketOps'}'),
              const SizedBox(height: 8),
              Text(
                '${user['name'] ?? 'User'}',
                style: const TextStyle(
                  fontSize: 30,
                  fontWeight: FontWeight.w900,
                  height: 1,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                dashboardCopy(user),
                style: const TextStyle(color: AppColors.muted, fontSize: 15),
              ),
            ],
          ),
        ),
        const SizedBox(height: 14),
        GridView.count(
          crossAxisCount: 2,
          childAspectRatio: 1.35,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          children: [
            StatCard(
              label: 'Open tickets',
              value: '${reports['open'] ?? tickets.length}',
              meta: 'Live work',
            ),
            StatCard(
              label: 'Critical',
              value: '${reports['critical'] ?? 0}',
              meta: 'Priority heat',
            ),
            StatCard(label: 'Done today', value: '$done', meta: 'Checklist'),
            StatCard(label: 'Pending', value: '$pending', meta: 'Today tasks'),
          ],
        ),
        const SizedBox(height: 14),
        GlassCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SectionLabel('Next action'),
              const SizedBox(height: 10),
              if (tasks.isNotEmpty)
                TaskTile(task: mapOf(tasks.first), onDone: null)
              else if (tickets.isNotEmpty)
                TicketTile(
                  ticket: mapOf(tickets.first),
                  user: user,
                  technicians: const [],
                  onAdvance: null,
                  onAccept: null,
                  onReject: null,
                  onAssign: null,
                )
              else
                const EmptyBlock('No active work right now.'),
            ],
          ),
        ),
      ],
    );
  }
}

class WorkPage extends StatelessWidget {
  const WorkPage({
    super.key,
    required this.user,
    required this.data,
    required this.todayTasks,
    required this.onTaskDone,
  });

  final Map<String, dynamic> user;
  final Map<String, dynamic> data;
  final List<dynamic> todayTasks;
  final Future<void> Function(String id) onTaskDone;

  @override
  Widget build(BuildContext context) {
    final role = '${user['role']}';
    final tasks = role == 'technician' ? todayTasks : listOf(data['tasks']);
    final copy = workPageCopy(role);

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        SectionLabel(copy.$1),
        const SizedBox(height: 4),
        Text(copy.$2, style: const TextStyle(color: AppColors.muted)),
        const SizedBox(height: 8),
        if (tasks.isEmpty)
          GlassCard(child: EmptyBlock(copy.$3))
        else
          ...tasks.map(
            (task) => Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: TaskTile(
                task: mapOf(task),
                onDone: role == 'technician' && !isDone(mapOf(task))
                    ? () => onTaskDone('${mapOf(task)['id']}')
                    : null,
              ),
            ),
          ),
      ],
    );
  }
}

class TicketPage extends StatelessWidget {
  const TicketPage({
    super.key,
    required this.user,
    required this.data,
    required this.onTicketAdvance,
    required this.onTicketAccept,
    required this.onTicketReject,
    required this.onTicketAssign,
  });

  final Map<String, dynamic> user;
  final Map<String, dynamic> data;
  final Future<void> Function(Map<String, dynamic> ticket) onTicketAdvance;
  final Future<void> Function(Map<String, dynamic> ticket) onTicketAccept;
  final Future<void> Function(Map<String, dynamic> ticket, String reason)
  onTicketReject;
  final Future<void> Function(Map<String, dynamic> ticket, String technicianId)
  onTicketAssign;

  @override
  Widget build(BuildContext context) {
    final role = '${user['role']}';
    final tickets = listOf(
      data['tickets'],
    ).map(mapOf).where((ticket) => '${ticket['status']}' != 'Closed').toList();
    final technicians = listOf(data['technicians']).map(mapOf).toList();

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        SectionLabel(ticketPageTitle(role)),
        const SizedBox(height: 4),
        Text(
          ticketPageCopy(role),
          style: const TextStyle(color: AppColors.muted),
        ),
        const SizedBox(height: 8),
        if (tickets.isEmpty)
          const GlassCard(child: EmptyBlock('No active tickets.'))
        else
          ...tickets.map(
            (ticket) => Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: TicketTile(
                ticket: ticket,
                user: user,
                technicians: technicians,
                onAccept:
                    role == 'technician' && '${ticket['status']}' == 'Assigned'
                    ? () => onTicketAccept(ticket)
                    : null,
                onReject:
                    role == 'technician' &&
                        [
                          'Assigned',
                          'Acknowledged',
                        ].contains('${ticket['status']}')
                    ? (reason) => onTicketReject(ticket, reason)
                    : null,
                onAssign: role == 'manager' || role == 'admin'
                    ? (technicianId) => onTicketAssign(ticket, technicianId)
                    : null,
                onAdvance:
                    nextTicketStatus('${ticket['status']}') == null ||
                        (role == 'technician' &&
                            '${ticket['status']}' == 'Assigned')
                    ? null
                    : () => onTicketAdvance(ticket),
              ),
            ),
          ),
      ],
    );
  }
}

class AccountPage extends StatelessWidget {
  const AccountPage({
    super.key,
    required this.user,
    required this.data,
    required this.onLogout,
    required this.onAttendance,
    required this.onPasswordChange,
  });

  final Map<String, dynamic> user;
  final Map<String, dynamic> data;
  final VoidCallback onLogout;
  final Future<void> Function(String status, String reason) onAttendance;
  final Future<void> Function(
    String currentPassword,
    String newPassword,
    String confirmPassword,
  )
  onPasswordChange;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        GlassCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SectionLabel('Signed in'),
              Text(
                '${user['name']}',
                style: const TextStyle(
                  fontSize: 26,
                  fontWeight: FontWeight.w900,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                '${user['post']}',
                style: const TextStyle(color: AppColors.muted),
              ),
              const SizedBox(height: 18),
              InfoRow('Role', '${user['role']}'),
              InfoRow('Storage', '${data['storage'] ?? 'supabase'}'),
              InfoRow('Outlet', '${user['outlet'] ?? 'All allowed'}'),
              const SizedBox(height: 18),
              PasswordChangeCard(onPasswordChange: onPasswordChange),
              if ('${user['role']}' == 'technician') ...[
                const SizedBox(height: 18),
                const SectionLabel('Attendance and availability'),
                const SizedBox(height: 10),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    ActionChip(
                      label: const Text('Present'),
                      onPressed: () =>
                          onAttendance('Present', 'Available from mobile app'),
                    ),
                    ActionChip(
                      label: const Text('Absent today'),
                      onPressed: () => onAttendance(
                        'Absent',
                        'Marked absent from mobile app',
                      ),
                    ),
                    ActionChip(
                      label: const Text('Emergency available'),
                      onPressed: () => onAttendance(
                        'Emergency Available',
                        'Emergency available from mobile app',
                      ),
                    ),
                  ],
                ),
              ],
              const SizedBox(height: 18),
              SecondaryButton(label: 'Logout', onPressed: onLogout),
            ],
          ),
        ),
      ],
    );
  }
}

class RoleBriefCard extends StatelessWidget {
  const RoleBriefCard({super.key, required this.user});

  final Map<String, dynamic> user;

  @override
  Widget build(BuildContext context) {
    final role = '${user['role']}';
    final items = roleResponsibilities(role);
    return GlassCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SectionLabel(
            role == 'admin'
                ? 'Control responsibility'
                : role == 'manager'
                ? 'Outlet responsibility'
                : 'Field responsibility',
          ),
          const SizedBox(height: 10),
          ...items.map(
            (item) => Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(
                    Icons.check_circle_rounded,
                    size: 17,
                    color: AppColors.teal.withValues(alpha: .82),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      item,
                      style: const TextStyle(
                        color: AppColors.muted,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class PasswordChangeCard extends StatefulWidget {
  const PasswordChangeCard({super.key, required this.onPasswordChange});

  final Future<void> Function(
    String currentPassword,
    String newPassword,
    String confirmPassword,
  )
  onPasswordChange;

  @override
  State<PasswordChangeCard> createState() => _PasswordChangeCardState();
}

class _PasswordChangeCardState extends State<PasswordChangeCard> {
  final currentPassword = TextEditingController();
  final newPassword = TextEditingController();
  final confirmPassword = TextEditingController();
  String status = 'Current password is required to change credentials.';
  bool saving = false;

  @override
  void dispose() {
    currentPassword.dispose();
    newPassword.dispose();
    confirmPassword.dispose();
    super.dispose();
  }

  Future<void> submit() async {
    if (saving) return;
    setState(() {
      saving = true;
      status = '';
    });
    try {
      await widget.onPasswordChange(
        currentPassword.text,
        newPassword.text,
        confirmPassword.text,
      );
      if (mounted) {
        setState(() {
          status = 'Password updated. Sign in again with the new password.';
          currentPassword.clear();
          newPassword.clear();
          confirmPassword.clear();
        });
      }
    } catch (error) {
      if (mounted) {
        setState(
          () => status = error.toString().replaceFirst('Exception: ', ''),
        );
      }
    } finally {
      if (mounted) setState(() => saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SectionLabel('Security'),
          const SizedBox(height: 8),
          const Text(
            'Change password',
            style: TextStyle(fontWeight: FontWeight.w900, fontSize: 20),
          ),
          const SizedBox(height: 6),
          const Text(
            'Update your login password for web and mobile access.',
            style: TextStyle(color: AppColors.muted),
          ),
          const SizedBox(height: 14),
          AppInput(
            controller: currentPassword,
            label: 'Current password',
            obscure: true,
          ),
          const SizedBox(height: 10),
          AppInput(
            controller: newPassword,
            label: 'New password',
            obscure: true,
          ),
          const SizedBox(height: 10),
          AppInput(
            controller: confirmPassword,
            label: 'Confirm new password',
            obscure: true,
          ),
          const SizedBox(height: 10),
          if (status.isNotEmpty) ...[
            Text(
              status,
              style: const TextStyle(
                color: AppColors.muted,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 10),
          ],
          PrimaryButton(
            label: saving ? 'Updating...' : 'Update Password',
            onPressed: saving ? null : submit,
          ),
        ],
      ),
    );
  }
}

class GlassCard extends StatelessWidget {
  const GlassCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(18),
  });

  final Widget child;
  final EdgeInsets padding;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(24),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 14, sigmaY: 14),
        child: Container(
          padding: padding,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(24),
            color: Colors.white.withValues(alpha: .48),
            border: Border.all(color: Colors.white.withValues(alpha: .72)),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF1F424B).withValues(alpha: .10),
                blurRadius: 28,
                offset: const Offset(0, 16),
              ),
            ],
          ),
          child: child,
        ),
      ),
    );
  }
}

class SectionLabel extends StatelessWidget {
  const SectionLabel(this.text, {super.key});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(
      text.toUpperCase(),
      style: const TextStyle(
        color: AppColors.accentStrong,
        fontSize: 11,
        letterSpacing: 1.4,
        fontWeight: FontWeight.w900,
      ),
    );
  }
}

class StatCard extends StatelessWidget {
  const StatCard({
    super.key,
    required this.label,
    required this.value,
    required this.meta,
  });

  final String label;
  final String value;
  final String meta;

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(
              color: AppColors.muted,
              fontWeight: FontWeight.w800,
            ),
          ),
          const Spacer(),
          Text(
            value,
            style: const TextStyle(
              fontSize: 29,
              fontWeight: FontWeight.w900,
              height: 1,
            ),
          ),
          const SizedBox(height: 5),
          Text(
            meta,
            style: const TextStyle(
              color: AppColors.accentStrong,
              fontSize: 12,
              fontWeight: FontWeight.w800,
            ),
          ),
        ],
      ),
    );
  }
}

class TaskTile extends StatelessWidget {
  const TaskTile({super.key, required this.task, required this.onDone});

  final Map<String, dynamic> task;
  final VoidCallback? onDone;

  @override
  Widget build(BuildContext context) {
    final done = isDone(task);
    return GlassCard(
      child: Row(
        children: [
          Icon(
            done
                ? Icons.check_circle_rounded
                : Icons.radio_button_unchecked_rounded,
            color: done ? AppColors.teal : AppColors.muted,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${task['title'] ?? task['task'] ?? 'Checklist task'}',
                  style: const TextStyle(fontWeight: FontWeight.w900),
                ),
                const SizedBox(height: 4),
                Text(
                  '${task['asset_name'] ?? task['assetName'] ?? task['asset'] ?? task['outlet'] ?? 'Asset'}',
                  style: const TextStyle(color: AppColors.muted, fontSize: 13),
                ),
              ],
            ),
          ),
          if (onDone != null)
            TextButton(onPressed: onDone, child: const Text('Done')),
        ],
      ),
    );
  }
}

class TicketTile extends StatefulWidget {
  const TicketTile({
    super.key,
    required this.ticket,
    required this.user,
    required this.technicians,
    required this.onAdvance,
    required this.onAccept,
    required this.onReject,
    required this.onAssign,
  });

  final Map<String, dynamic> ticket;
  final Map<String, dynamic> user;
  final List<Map<String, dynamic>> technicians;
  final VoidCallback? onAdvance;
  final VoidCallback? onAccept;
  final Future<void> Function(String reason)? onReject;
  final Future<void> Function(String technicianId)? onAssign;

  @override
  State<TicketTile> createState() => _TicketTileState();
}

class _TicketTileState extends State<TicketTile> {
  late String selectedTechnician = firstAssignableTechnician(
    widget.technicians,
    widget.ticket,
  );

  Future<void> rejectWithReason() async {
    final controller = TextEditingController();
    final reason = await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Reject job'),
        content: TextField(
          controller: controller,
          autofocus: true,
          minLines: 2,
          maxLines: 4,
          decoration: const InputDecoration(
            labelText: 'Reason required',
            hintText: 'Example: no tool kit available',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, controller.text.trim()),
            child: const Text('Reject'),
          ),
        ],
      ),
    );
    if (reason == null || reason.isEmpty) return;
    await widget.onReject?.call(reason);
  }

  @override
  Widget build(BuildContext context) {
    final ticket = widget.ticket;
    final status = '${ticket['status'] ?? 'New'}';
    final next = nextTicketStatus(status);
    final role = '${widget.user['role']}';
    final assignableTechnicians = widget.technicians
        .where((tech) => canMobileAssignTech(tech, ticket, role))
        .toList();
    if (selectedTechnician.isEmpty && assignableTechnicians.isNotEmpty) {
      selectedTechnician = '${assignableTechnicians.first['id']}';
    }
    return GlassCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Text(
                  '${ticket['id'] ?? ''} ${ticket['note'] ?? ticket['description'] ?? ''}',
                  style: const TextStyle(
                    fontWeight: FontWeight.w900,
                    fontSize: 16,
                  ),
                ),
              ),
              StatusPill(status),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            '${ticket['outlet'] ?? ''} / ${ticket['category'] ?? ''} / ${ticket['impact'] ?? ''}',
            style: const TextStyle(color: AppColors.muted, fontSize: 13),
          ),
          if (widget.onAssign != null &&
              assignableTechnicians.isNotEmpty &&
              ![
                'Closed',
                'Cancelled',
                'Resolved',
                'Verification Pending',
              ].contains(status)) ...[
            const SizedBox(height: 14),
            DropdownButtonFormField<String>(
              initialValue: selectedTechnician,
              items: assignableTechnicians
                  .map(
                    (tech) => DropdownMenuItem(
                      value: '${tech['id']}',
                      child: Text(
                        '${tech['name']} / ${tech['status']} / ${tech['skill']}',
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  )
                  .toList(),
              onChanged: (value) =>
                  setState(() => selectedTechnician = value ?? ''),
              decoration: const InputDecoration(labelText: 'Assign technician'),
            ),
            const SizedBox(height: 10),
            PrimaryButton(
              label: 'Assign',
              onPressed: selectedTechnician.isEmpty
                  ? null
                  : () => widget.onAssign?.call(selectedTechnician),
            ),
          ],
          if (widget.onAccept != null) ...[
            const SizedBox(height: 14),
            PrimaryButton(label: 'Accept job', onPressed: widget.onAccept),
          ],
          if (widget.onReject != null) ...[
            const SizedBox(height: 10),
            SecondaryButton(
              label: 'Reject with reason',
              onPressed: rejectWithReason,
            ),
          ],
          if (widget.onAdvance != null && next != null) ...[
            const SizedBox(height: 14),
            PrimaryButton(label: 'Move to $next', onPressed: widget.onAdvance),
          ],
        ],
      ),
    );
  }
}

class StatusPill extends StatelessWidget {
  const StatusPill(this.status, {super.key});

  final String status;

  @override
  Widget build(BuildContext context) {
    final color = status == 'Blocked'
        ? AppColors.warning
        : status == 'New'
        ? AppColors.danger
        : AppColors.teal;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
      decoration: BoxDecoration(
        color: color.withValues(alpha: .12),
        borderRadius: BorderRadius.circular(99),
      ),
      child: Text(
        status,
        style: TextStyle(
          color: color,
          fontSize: 12,
          fontWeight: FontWeight.w900,
        ),
      ),
    );
  }
}

class AppInput extends StatelessWidget {
  const AppInput({
    super.key,
    required this.controller,
    required this.label,
    this.obscure = false,
  });

  final TextEditingController controller;
  final String label;
  final bool obscure;

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      obscureText: obscure,
      decoration: InputDecoration(
        labelText: label,
        filled: true,
        fillColor: Colors.white.withValues(alpha: .55),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(
            color: AppColors.accent.withValues(alpha: .24),
          ),
        ),
      ),
    );
  }
}

class PrimaryButton extends StatelessWidget {
  const PrimaryButton({
    super.key,
    required this.label,
    required this.onPressed,
  });

  final String label;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    return FilledButton(
      onPressed: onPressed,
      style: FilledButton.styleFrom(
        minimumSize: const Size.fromHeight(48),
        backgroundColor: AppColors.teal,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      ),
      child: Text(label, style: const TextStyle(fontWeight: FontWeight.w900)),
    );
  }
}

class SecondaryButton extends StatelessWidget {
  const SecondaryButton({
    super.key,
    required this.label,
    required this.onPressed,
  });

  final String label;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return OutlinedButton(
      onPressed: onPressed,
      style: OutlinedButton.styleFrom(
        minimumSize: const Size.fromHeight(46),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      ),
      child: Text(label, style: const TextStyle(fontWeight: FontWeight.w900)),
    );
  }
}

class InfoRow extends StatelessWidget {
  const InfoRow(this.label, this.value, {super.key});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 7),
      child: Row(
        children: [
          Expanded(
            child: Text(label, style: const TextStyle(color: AppColors.muted)),
          ),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w900)),
        ],
      ),
    );
  }
}

class EmptyBlock extends StatelessWidget {
  const EmptyBlock(this.message, {super.key});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 20),
      child: Center(
        child: Text(
          message,
          style: const TextStyle(
            color: AppColors.muted,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
    );
  }
}

Map<String, dynamic> mapOf(Object? value) =>
    value is Map<String, dynamic> ? value : <String, dynamic>{};

List<dynamic> listOf(Object? value) => value is List ? value : <dynamic>[];

bool canMobileAssignTech(
  Map<String, dynamic> technician,
  Map<String, dynamic> ticket,
  String role,
) {
  final status = '${technician['status']}';
  final outlets = listOf(technician['serviceOutlets']).map((item) => '$item');
  final servesOutlet = outlets.contains('${ticket['outlet']}');
  final available = ['Present', 'Busy', 'Emergency Available'].contains(status);
  if (role == 'manager') return available && servesOutlet;
  return true;
}

String firstAssignableTechnician(
  List<Map<String, dynamic>> technicians,
  Map<String, dynamic> ticket,
) {
  if (technicians.isEmpty) return '';
  final preferred =
      '${ticket['suggestedTechnician'] is Map ? mapOf(ticket['suggestedTechnician'])['id'] : ''}';
  if (preferred.isNotEmpty &&
      technicians.any((tech) => '${tech['id']}' == preferred)) {
    return preferred;
  }
  final assigned = '${ticket['assignedTo'] ?? ''}';
  if (assigned.isNotEmpty &&
      technicians.any((tech) => '${tech['id']}' == assigned)) {
    return assigned;
  }
  return '${technicians.first['id']}';
}

bool isDone(Map<String, dynamic> task) {
  final status = '${task['status']}'.toLowerCase();
  return status == 'done';
}

String? nextTicketStatus(String status) {
  switch (status) {
    case 'Assigned':
      return 'Acknowledged';
    case 'Acknowledged':
      return 'In Progress';
    case 'In Progress':
    case 'Reopened':
      return 'Resolved';
    default:
      return null;
  }
}

String roleTitle(Map<String, dynamic> user) {
  switch ('${user['role']}') {
    case 'technician':
      return 'Field Console';
    case 'manager':
      return '${user['outlet'] ?? 'Outlet'} Desk';
    case 'admin':
      return 'Control Room';
    default:
      return 'TicketOps';
  }
}

List<NavigationDestination> mobileDestinations(Map<String, dynamic> user) {
  switch ('${user['role']}') {
    case 'technician':
      return const [
        NavigationDestination(icon: Icon(Icons.today_outlined), label: 'Today'),
        NavigationDestination(
          icon: Icon(Icons.checklist_rounded),
          label: 'Checklist',
        ),
        NavigationDestination(
          icon: Icon(Icons.engineering_outlined),
          label: 'Jobs',
        ),
        NavigationDestination(
          icon: Icon(Icons.event_available_outlined),
          label: 'Availability',
        ),
      ];
    case 'manager':
      return const [
        NavigationDestination(
          icon: Icon(Icons.insights_outlined),
          label: 'Outlet',
        ),
        NavigationDestination(
          icon: Icon(Icons.task_alt_rounded),
          label: 'Tasks',
        ),
        NavigationDestination(
          icon: Icon(Icons.assignment_ind_outlined),
          label: 'Assign',
        ),
        NavigationDestination(
          icon: Icon(Icons.person_outline_rounded),
          label: 'Account',
        ),
      ];
    case 'admin':
      return const [
        NavigationDestination(
          icon: Icon(Icons.space_dashboard_outlined),
          label: 'Control',
        ),
        NavigationDestination(
          icon: Icon(Icons.rule_folder_outlined),
          label: 'Rules',
        ),
        NavigationDestination(
          icon: Icon(Icons.admin_panel_settings_outlined),
          label: 'Tickets',
        ),
        NavigationDestination(
          icon: Icon(Icons.manage_accounts_outlined),
          label: 'Profile',
        ),
      ];
    default:
      return const [
        NavigationDestination(
          icon: Icon(Icons.space_dashboard_outlined),
          label: 'Overview',
        ),
        NavigationDestination(
          icon: Icon(Icons.task_alt_rounded),
          label: 'Tasks',
        ),
        NavigationDestination(
          icon: Icon(Icons.confirmation_number_outlined),
          label: 'Tickets',
        ),
        NavigationDestination(
          icon: Icon(Icons.person_outline_rounded),
          label: 'Account',
        ),
      ];
  }
}

List<String> roleResponsibilities(String role) {
  switch (role) {
    case 'technician':
      return const [
        'Mark attendance and live availability before work is assigned.',
        'Complete today checklist for assigned assets.',
        'Accept or reject issue jobs with a clear reason.',
      ];
    case 'manager':
      return const [
        'Create outlet issue tickets with clear asset and priority context.',
        'Assign work to available technicians for the outlet.',
        'Track pending, blocked, and resolved work without admin controls.',
      ];
    case 'admin':
      return const [
        'Maintain users, outlets, assets, categories, and checklist rules.',
        'Monitor queues and override assignment only when operations require it.',
        'Keep the system structure clean instead of doing technician work.',
      ];
    default:
      return const ['View operational status and assigned work.'];
  }
}

(String, String, String) workPageCopy(String role) {
  switch (role) {
    case 'technician':
      return (
        'Today checklist',
        'Only the tasks assigned to you for today. Finish these before closing the shift.',
        'No checklist tasks assigned for today.',
      );
    case 'manager':
      return (
        'Outlet task visibility',
        'Read-only view of maintenance pressure for your outlet. Assignment happens in Assign.',
        'No outlet checklist pressure right now.',
      );
    case 'admin':
      return (
        'Checklist rules preview',
        'System-level task visibility. Edit real rules from Scheduler on the web portal.',
        'No generated checklist tasks are visible.',
      );
    default:
      return ('Tasks', 'Assigned task visibility.', 'No tasks assigned.');
  }
}

String ticketPageTitle(String role) {
  switch (role) {
    case 'manager':
      return 'Outlet assignment queue';
    case 'admin':
      return 'Control ticket queue';
    case 'technician':
      return 'My issue jobs';
    default:
      return 'Tickets';
  }
}

String ticketPageCopy(String role) {
  switch (role) {
    case 'manager':
      return 'Assign outlet issues to the best available technician.';
    case 'admin':
      return 'Monitor escalations and override only when manager routing is insufficient.';
    case 'technician':
      return 'Accept jobs you can handle, or reject with a reason so dispatch can reassign.';
    default:
      return 'Open issue work.';
  }
}

String dashboardCopy(Map<String, dynamic> user) {
  switch ('${user['role']}') {
    case 'technician':
      return 'Today checklist, assigned tickets, and status updates in one mobile surface.';
    case 'manager':
      return 'Outlet tickets and verification pressure without desktop noise.';
    case 'admin':
      return 'Live operational control across tickets, technicians, and maintenance work.';
    default:
      return 'Operational maintenance visibility.';
  }
}

String cleanError(Object exception) {
  return exception.toString().replaceFirst('Exception: ', '');
}
