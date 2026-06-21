---
title: ARM 国产化环境部署笔记
date: "2025-04-27"
tags: [ARM, 国产化, 麒麟, 运维]
description: "qemu-system-aarch64.exe -m 16384 -cpu cortex-a72 -smp 8,sockets=4,cores=2 -M virt -bios D:\\virtual-machines\\qe..."
published: true
---

# ARM 国产化环境部署笔记

## 背景（Situation）

持续把项目里的各种组件往 ARM 平台搬，过程里有不少与 x86 不同的细节。

## 目标（Task）

把每次踩坑记录沉淀下来，避免后人重复踩。

## 行动（Action）

qemu-system-aarch64.exe -m 16384 -cpu cortex-a72 -smp 8,sockets=4,cores=2 -M virt -bios D:\virtual-machines\qemu\kylinV10\QEMU_Kylin_EFI.fd -device VGA -device nec-usb-xhci -device usb-mouse -device usb-kbd -drive if=none,file=D:\virtual-machines\qemu\kylin\kylindisk.qcow2,id=hd0 -device virtio-blk-device,drive=hd0 -drive if=none,file=D:\Tools\iso\Kylin-Server-10-SP2-aarch64-Release-Build09-20210524.iso,id=cdrom,media=cdrom -device virtio-scsi-device -device scsi-cd,drive=cdrom -net nic -net tap,ifname=tap0

qemu-system-aarch64.exe -m 16384 -cpu cortex-a72 -smp 8,sockets=4,cores=2 -M virt -bios D:\virtual-machines\qemu\kylinV10\QEMU_Kylin_EFI.fd -device VGA -device nec-usb-xhci -device usb-mouse -device usb-kbd -drive if=none,file=D:\virtual-machines\qemu\kylinV10\kylindisk.qcow2,id=hd0 -device virtio-blk-device,drive=hd0 -drive if=none,file=,id=cdrom,media=cdrom -device virtio-scsi-device -device scsi-cd,drive=cdrom -net nic -net tap,ifname=tap0

systemctl stop firewalld

qemu-system-aarch64.exe -m 16384 -cpu cortex-a72 -smp 8,sockets=4,cores=2 -M virt -bios D:\virtual-machines\qemu\kylinV10\QEMU_Kylin_EFI.fd -device VGA -device nec-usb-xhci -device usb-mouse -device usb-kbd -drive if=none,file=D:\virtual-machines\qemu\kylinV10\kylindisk.qcow2,id=hd0 -device virtio-blk-device,drive=hd0 -drive if=none,file=,id=cdrom,media=cdrom -device virtio-scsi-device -device scsi-cd,drive=cdrom -net nic -net tap,ifname=tap0

## 收获（Result）

这份笔记后来成了团队 ARM 适配 SOP 的早期版本。

> 这篇笔记最初是工作中的速记，沉淀到博客是希望日后遇到类似问题能直接复用，也欢迎对同样场景有经验的同学一起讨论。
