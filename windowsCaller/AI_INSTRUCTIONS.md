# AI Context Memory & Instructions: Windows Caller App

**To Future AI Assistants:** Read this document immediately when analyzing or modifying the `windowsCaller` directory. It contains critical architectural decisions, constraints, and instructions required to successfully work on this project.

## 1. Project Purpose & Environment
This application is a .NET C# desktop version of the OpenQ web teller window. It was specifically created to run on legacy hardware (e.g., Windows XP and Windows 7) that the client still uses.
- **Target Framework:** .NET Framework 4.0 (for maximum legacy compatibility).
- **Backend:** Communicates with the primary Node.js OpenQ backend (default port `12341` or configured via `app.config`/`ApiClient.cs`).

## 2. STRICT Code Constraints (CRITICAL)
Because this project targets .NET 4.0 and is compiled directly from the command line using an older MSBuild compiler, **modern C# features will break the build.**
- **NO String Interpolation:** You must use `string.Format("{0} {1}", a, b)` instead of `$"{a} {b}"`.
- **NO Auto-Property Initializers:** You must use private backing fields or constructors instead of `public string X { get; set; } = "default";`.
- **NO Expression-Bodied Members:** Do not use `=>` for methods or properties.
- **NO Out Variable Declarations:** You must declare variables before out parameters. (e.g., `DateTime dt; DateTime.TryParse(..., out dt);`).
- **NO Null-Conditional Operators:** Do not use `?.` or `??=`.

## 3. UI/UX Design System (Dependency-Free Guna Style)
The UI is designed to look like a modern UI framework (like Guna UI) but **without external dependencies**. This ensures the app can be compiled on any machine without NuGet package restore issues.
- **Compact Size:** `MainForm.cs` is strictly restricted to `300 x 325` to act as a tiny widget on the teller's screen. Do not enlarge it.
- **Flat Aesthetics:** Uses `FlatStyle.Flat` with `FlatAppearance.BorderSize = 0` on buttons.
- **Colors & Typography:** Uses `Segoe UI` fonts and flat vibrant HEX/ARGB colors (e.g., `Color.FromArgb(52, 152, 219)`).
- **Icons:** Uses Unicode characters (✅, ⏸, 🔄, ➡️, ❌) directly in the `.Text` property of buttons instead of image resources.

## 4. API & Deserialization Quirks
- **`ApiClient.cs`**: Handles HTTP requests and maintains session cookies via `CookieContainer`.
- **JSON Arrays:** The native .NET 4.0 `JavaScriptSerializer` parses top-level JSON arrays as `System.Collections.ArrayList`, which causes a `MissingMethodException` if you attempt to cast it directly to `object[]` via `Get<object[]>`. 
  - **Rule:** ALWAYS use the custom `ApiClient.GetArray(endpoint)` method when fetching arrays from the backend (e.g., ticket lists, tellers).

## 5. Compilation Instructions
This project does not require Visual Studio. It is built via PowerShell:
```powershell
& "C:\Windows\Microsoft.NET\Framework64\v4.0.30319\MSBuild.exe" CallerApp.csproj
```
If you encounter `MSB3021` or `MSB3026` (Cannot access file), it means the `CallerApp.exe` is currently running and locking the file. Close the app and rebuild.

## 6. Architecture Breakdown
- `CallerApp.csproj`: The build manifest (do not add external NuGet references).
- `Program.cs`: Entry point. Shows `LoginForm`, and if successful, launches `MainForm`.
- `ApiClient.cs`: Core networking logic and JSON parsing.
- `MainForm.cs`: The 300x325 widget containing a `TabControl` for Home, Wait, Held, and Recv queues. Uses a 3-second polling timer to update queues in the background.
- `ForwardModal.cs` & `VoidModal.cs`: Compact, styled dialogs for ticket actions.
