# 🔧 Instance Management Guide

Local Task Tracker includes robust single-instance management to ensure only one server runs at a time. This prevents conflicts, resource issues, and data corruption.

## 🎯 Features

- **Automatic Detection**: Detects existing instances using port binding and lock files
- **Smart Warnings**: Shows helpful warnings with instance information
- **Graceful Termination**: Safely terminates duplicate instances
- **Process Communication**: Allows communication between instances (focus, commands)
- **Stale Lock Cleanup**: Automatically removes stale lock files
- **User-Friendly Tools**: Comprehensive management utilities

## 🚀 Quick Start

### Option 1: Smart Development Mode (Recommended)
```bash
npm run dev:smart
```

This interactive script will:
- Check for existing instances
- Give you options to terminate, focus, or exit
- Handle stale locks automatically
- Provide a smooth development experience

### Option 2: Standard Development Mode
```bash
npm run dev
```

Standard mode will:
- Automatically detect duplicates and exit
- Show warning messages with helpful commands
- Notify existing instance to focus

## 🛠️ Management Commands

### Check Instance Status
```bash
npm run instances:status
```
Shows detailed information about running instances:
- Process ID (PID)
- Start time and uptime
- Version information
- Running status

### Terminate All Instances
```bash
npm run instances:kill
```
Safely terminates all running instances and cleans up lock files.

### Clean Up Stale Files
```bash
npm run instances:cleanup
```
Removes stale lock files and port configurations.

### Focus Existing Instance
```bash
npm run instances:focus
```
Sends a focus command to existing instance (shows notification or brings window to front).

## 🔍 How It Works

### 1. Lock Port System
- Uses TCP port **58765** for instance detection
- Only one process can bind to this port
- Immediate detection of running instances

### 2. Lock File System
- Creates `.app-instance.lock` with process information
- Includes PID, timestamp, and version
- Protects against stale locks (5-minute timeout)

### 3. Process Validation
- Cross-platform process checking (Windows/Unix)
- Validates that PID actually exists
- Removes stale locks automatically

### 4. Communication Channel
- TCP-based messaging between instances
- Supports commands like 'focus', 'status'
- Enables coordination between processes

## ⚠️ Common Scenarios

### Scenario 1: Development Restart
When restarting development, you might see:
```
⚠️  DUPLICATE INSTANCE DETECTED
Another instance of Local Task Tracker is already running!
• PID: 12345
• Started: 19/09/2025, 15:30:00
• Uptime: 120s

💡 To manage instances, use these commands:
   npm run instances:kill    - Terminate all instances
   npm run dev:smart        - Interactive startup
```

**Solution**: Use `npm run dev:smart` for interactive options.

### Scenario 2: Stale Lock Files
After unexpected shutdown:
```
🧹 Stale lock file detected, cleaning up...
✅ Cleanup completed
🚀 Starting development server...
```

**Solution**: Automatic cleanup, no action needed.

### Scenario 3: Port Conflicts
If port 58765 is occupied by another application:
```
Lock port 58765 is in use
```

**Solution**: Change `LOCK_PORT` in `SingleInstanceManager.ts` or terminate the conflicting process.

## 🔧 Configuration

### Customize Lock Port
Edit `src/server/utils/SingleInstanceManager.ts`:
```typescript
this.lockPort = 58765; // Change to different port
```

### Modify Lock Timeout
Edit stale lock timeout:
```typescript
const maxLockAge = 5 * 60 * 1000; // 5 minutes -> change as needed
```

### Lock File Location
Default: `.app-instance.lock` in project root
```typescript
this.lockFilePath = path.join(process.cwd(), '.app-instance.lock');
```

## 🐛 Troubleshooting

### Problem: Multiple instances still running
**Symptoms**: Multiple servers responding, conflicting behavior
**Solution**:
```bash
npm run instances:kill
npm run instances:cleanup
npm run dev:smart
```

### Problem: "Permission denied" on lock file
**Symptoms**: Cannot create or remove lock file
**Solution**:
- Check file permissions
- Run as administrator (Windows)
- Manually remove `.app-instance.lock`

### Problem: Port binding fails
**Symptoms**: Cannot bind to lock port
**Solution**:
- Check if port 58765 is used by another app
- Change `LOCK_PORT` in configuration
- Use `netstat -ano | findstr :58765` (Windows) to check port usage

### Problem: Stale locks persist
**Symptoms**: Always shows "another instance running" but none exists
**Solution**:
```bash
npm run instances:cleanup
# Or manually delete .app-instance.lock
```

## 📊 Monitoring & Logs

### Check Logs
Instance management logs are written with these prefixes:
- `INFO: Single instance lock acquired successfully`
- `WARN: Another instance detected`
- `DEBUG: Lock port binding status`

### Performance Impact
- Lock file operations: < 1ms
- Port binding check: < 10ms
- Process validation: < 50ms
- Total startup overhead: < 100ms

## 🔒 Security Considerations

### Lock File Contents
The lock file contains:
```json
{
  "pid": 12345,
  "timestamp": 1695134400000,
  "startTime": "2025-09-19T15:30:00.000Z",
  "version": "1.0.0"
}
```

**Note**: No sensitive information is stored.

### Port Security
- Lock port (58765) only accepts local connections
- No external access allowed
- Simple JSON message protocol

### Process Validation
- Uses OS-level process checking
- No privilege escalation required
- Safe cross-platform implementation

## 📈 Best Practices

1. **Use Smart Mode**: Always use `npm run dev:smart` for development
2. **Clean Shutdowns**: Use Ctrl+C to gracefully stop servers
3. **Regular Cleanup**: Run `npm run instances:cleanup` if issues persist
4. **Monitor Logs**: Check console output for instance management messages
5. **Avoid Force Kills**: Let the instance manager handle termination

## 🔗 Related Files

- `src/server/utils/SingleInstanceManager.ts` - Core implementation
- `scripts/check-instances.js` - Management utility
- `scripts/smart-dev.js` - Interactive startup script
- `.app-instance.lock` - Lock file (auto-generated)
- `port-config.json` - Port configuration (auto-generated)

---

💡 **Tip**: For the best development experience, always use `npm run dev:smart` which provides interactive options and handles all common scenarios automatically!