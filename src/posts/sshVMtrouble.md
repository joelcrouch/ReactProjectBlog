# SSH Key-Based Authentication Troubleshooting Log

## ✅ Goal

Set up **passwordless SSH access** using public key authentication from a host machine to a VM (`dev1@192.168.0.106`).

---

## 🧩 Issues Encountered

### 1. `sshd.service not found`
- **Cause:** Some systems name the SSH service `ssh`, not `sshd`.
- **Fix:** Use:
```bash
  sudo systemctl restart ssh
```

Also typos are entirely possible, but I do believe (correct me if I am wrong) that BSD does use 'sshd' for that command.  Anyways, use the correct command for your OS.


### 2. Permission denied (publickey)

- Cause: Server accepts only public keys, but the correct key wasn’t accepted or wasn’t configured properly.

- Possible reasons:

    - Public key was not in the right user's ~/.ssh/authorized_keys

    - Wrong file permissions or ownership

    - SSH client wasn’t sending the correct private key

- Fixes:

    - Ensure public key is in /home/dev1/.ssh/authorized_keys

    - Set correct permissions:

    ```bash
        chmod 700 ~/.ssh
        chmod 600 ~/.ssh/authorized_keys
        chown dev1:dev1 ~/.ssh ~/.ssh/authorized_keys
    ```

- Verify client uses the right private key:

```bash
            ssh -i ~/.ssh/dev1-3101 dev1@<IP_address>  
    
            Note: Replace <IP_address> with the address of your vm.

```

### 3. Connection timed out

-  Cause: SSH client could not reach the VM — likely a network issue.

    Fixes:

    -  Double-check IP (watch for leading zero typo like 192.168.0106)

    -  Confirm SSH server is running:

```bash
        sudo systemctl status ssh
```
Open firewall (if ufw is enabled):
```bash
        sudo ufw allow ssh
```

Also, and this was kinda challenging to notice: Make sure the host is actualy connected to a viable internet. My connection was spotty, and the attempts to connect kept on timing out. 

### 🛠 SSH Config Setup

Created ~/.ssh/config:
```
    Host dev1
        HostName <IP_ADDRESS>
        User dev1
        IdentityFile ~/.ssh/<SSHKEYYOUEMADE>
```
This allows passwordless login with a simple:
```bash
        ssh dev1
```
### ✅ Final Working Setup

    sshd_config on VM:
```  etc/ssh/sshd_config
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
```
Proper key permissions and placement

Verified with:
```bash
    ssh -i ~/.ssh/dev1-3101 dev1@<IP_ADDRESS>
    ssh dev1  # via config file
````


### 🔒 Optional Hardening

Change default SSH port:
```etc/ssh/sshd_config
Port 2222

Restrict users:

AllowUsers dev1
```
Restart SSH to apply changes:
```bash
    sudo systemctl restart ssh
```
