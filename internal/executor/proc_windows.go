//go:build windows

package executor

import (
	"os/exec"
	"syscall"
)

// hideWindow suppresses the console window on Windows by setting CREATE_NO_WINDOW.
func hideWindow(cmd *exec.Cmd) {
	cmd.SysProcAttr = &syscall.SysProcAttr{
		CreationFlags: 0x08000000, // CREATE_NO_WINDOW
	}
}
