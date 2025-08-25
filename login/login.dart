// client.dart
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'dart:io';

const String baseUrl = 'http://localhost:3000';

Uri loginUrl() => Uri.parse('$baseUrl/login');
Uri expensesAllUrl(int userId) => Uri.parse('$baseUrl/expenses/all/$userId');
Uri expensesTodayUrl(int userId) => Uri.parse('$baseUrl/expenses/today/$userId');
Uri searchExpensesUrl(int userId, String q) =>
    Uri.parse('$baseUrl/expenses/search/$userId?q=${Uri.encodeQueryComponent(q)}');
Uri addExpenseUrl() => Uri.parse('$baseUrl/expenses/add');
Uri deleteExpenseUrl(int id) => Uri.parse('$baseUrl/expenses/delete/$id');

Future<void> main() async {
  print("===== Login =====");
  stdout.write("Username: ");
  final username = stdin.readLineSync()?.trim();
  stdout.write("Password: ");
  final password = stdin.readLineSync()?.trim();

  if (username == null || password == null || username.isEmpty || password.isEmpty) {
    print("Incomplete input");
    return;
  }

  final response = await http.post(loginUrl(), body: {
    "username": username,
    "password": password,
  });

  if (response.statusCode != 200) {
    print("Login failed: ${response.body.isNotEmpty ? response.body : response.reasonPhrase}");
    return;
  }

  Map<String, dynamic> loginData;
  try {
    loginData = jsonDecode(response.body) as Map<String, dynamic>;
  } catch (_) {
    print("Invalid login response.");
    return;
  }

  final dynamic rawId = loginData["userId"];
  final int? userId = rawId is int ? rawId : (rawId is String ? int.tryParse(rawId) : null);
  if (userId == null) {
    print("Login response missing/invalid userId.");
    return;
  }

  // menu loop
  while (true) {
    print("\n========= Expense Tracking App =========");
    print("1. All expenses");
    print("2. Today's expense");
    print("3. Search expense");
    print("4. Add new expense");
    print("5. Delete an expense");
    print("6. Exit");
    stdout.write("Choose... ");
    final choice = stdin.readLineSync()?.trim();

    switch (choice) {
      case "1":
        await fetchExpenses(userId, all: true);
        break;
      case "2":
        await fetchExpenses(userId, all: false);
        break;
      case "3":
        await searchExpense(userId);
        break;
      case "4":
        await addExpense(userId);
        break;
      case "5":
        await deleteExpense(userId);
        break;
      case "6":
        print("---- Bye -------");
        return;
      default:
        print("Invalid choice, try again.");
    }
  }
}

Future<void> fetchExpenses(int userId, {required bool all}) async {
  final url = all ? expensesAllUrl(userId) : expensesTodayUrl(userId);

  final response = await http.get(url);
  if (response.statusCode != 200) {
    print("Error fetching expenses: ${response.body}");
    return;
  }

  List<dynamic> expenses;
  try {
    expenses = jsonDecode(response.body) as List<dynamic>;
  } catch (_) {
    print("Invalid data format from server.");
    return;
  }

  if (expenses.isEmpty) {
    print("No expenses found.");
    return;
  }

  int total = 0;
  print(all ? "------------ All expenses -----------" : "--------- Today's expenses ---------");
  for (int i = 0; i < expenses.length; i++) {
    final e = expenses[i] as Map<String, dynamic>;
    final paid = (e["paid"] as num).toInt();
    total += paid;
    final item = e["item"];
    final date = e["date"];
    print("${i + 1}. $item : ${paid}฿ : $date");
  }
  print("Total expenses = ${total}฿");
}

Future<void> searchExpense(int userId) async {
  stdout.write("Search keyword: ");
  final q = stdin.readLineSync()?.trim() ?? "";
  if (q.isEmpty) {
    print("Empty query.");
    return;
  }

  final resp = await http.get(searchExpensesUrl(userId, q));
  if (resp.statusCode != 200) {
    print("Search error: ${resp.body}");
    return;
  }

  List<dynamic> items;
  try {
    items = jsonDecode(resp.body) as List<dynamic>;
  } catch (_) {
    print("Invalid data format from server.");
    return;
  }

  if (items.isEmpty) {
    print("No results.");
    return;
  }

  int subtotal = 0;
  print('--------- Search results for "$q" ---------');
  for (int i = 0; i < items.length; i++) {
    final e = items[i] as Map<String, dynamic>;
    final paid = (e["paid"] as num).toInt();
    subtotal += paid;
    final id = e["id"];
    final item = e["item"];
    final date = e["date"];
    print("${i + 1}. [id=$id] $item : ${paid}฿ : $date");
  }
  print("Subtotal (results) = ${subtotal}฿");
}

Future<void> addExpense(int userId) async {
  stdout.write("Item: ");
  final item = stdin.readLineSync()?.trim() ?? "";
  stdout.write("Paid (number): ");
  final paidStr = stdin.readLineSync()?.trim() ?? "";
  final paid = int.tryParse(paidStr);

  if (item.isEmpty || paid == null) {
    print("Invalid input.");
    return;
  }

  final resp = await http.post(addExpenseUrl(), body: {
    "userId": "$userId",
    "item": item,
    "paid": "$paid",
  });

  if (resp.statusCode == 201) {
    print("Expense added successfully");
  } else {
    print("Add error: ${resp.body}");
  }
}

Future<void> deleteExpense(int userId) async {
  stdout.write("Enter expense id to delete: ");
  final idStr = stdin.readLineSync()?.trim() ?? "";
  final id = int.tryParse(idStr);
  if (id == null) {
    print("Invalid id.");
    return;
  }

  final resp = await http.delete(deleteExpenseUrl(id), body: {
    "userId": "$userId",
  });

  if (resp.statusCode == 200) {
    print("Expense deleted successfully.");
  } else {
    print("Delete error: ${resp.body}");
  }
}
