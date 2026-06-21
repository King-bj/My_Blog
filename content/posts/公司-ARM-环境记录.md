---
title: 公司 ARM 实验环境清单记录
date: "2025-05-13"
tags: [ARM, 国产化, 麒麟, 运维]
description: "qemu-img create -f qcow2 D:\\Tools\\develop\\qemu\\server\\kylinarm\\kylindisk.qcow2 40G qemu-system-aarch64 -m 8192..."
published: true
---

# 公司 ARM 实验环境清单记录

> **背景：** 公司业务需要全面适配国产化（ARM + 麒麟/统信 + 达梦），我负责把现有 x86 上跑通的组件迁到 ARM 平台，下面是当时的完整记录与思考。

qemu-img create -f qcow2 D:\Tools\develop\qemu\server\kylinarm\kylindisk.qcow2 40G

qemu-system-aarch64 -m 8192 -cpu cortex-a72 -smp 8,sockets=4,cores=2 -M virt -bios D:\Tools\develop\qemu\server\QEMU_EFI.fd -device VGA -device nec-usb-xhci -device usb-mouse -device usb-kbd -drive if=none,file=D:\Tools\develop\qemu\server\kylinarm\kylindisk.qcow2,id=hd0 -device virtio-blk-device,drive=hd0 -drive if=none,file=D:\Tools\develop\iso\Kylin-Server-10-SP2-aarch64-Release-Build09-20210524.iso,id=cdrom,media=cdrom -device virtio-scsi-device -device scsi-cd,drive=cdrom -net nic -net user,hostfwd=tcp::2222-:22

qemu-system-aarch64 -m 12288 -cpu cortex-a72 -smp 8,sockets=4,cores=2 -M virt -bios D:\Tools\develop\qemu\server\QEMU_EFI.fd -device VGA -device nec-usb-xhci -device usb-mouse -device usb-kbd -drive if=none,file=D:\Tools\develop\qemu\server\kylinarm\kylindisk.qcow2,id=hd0 -device virtio-blk-device,drive=hd0 -drive if=none,file=,id=cdrom,media=cdrom -device virtio-scsi-device -device scsi-cd,drive=cdrom -net nic -net user,hostfwd=tcp::2222-:22,hostfwd=tcp::8033-:38033

#phantomjs  
qemu-system-aarch64 -m 8192 -cpu cortex-a72 -smp 8,sockets=4,cores=2 -M virt -bios D:\Tools\develop\qemu\server\QEMU_EFI.fd -device VGA -device nec-usb-xhci -device usb-mouse -device usb-kbd -drive if=none,file=D:\Tools\develop\qemu\server\phantomjs\kylindisk.qcow2,id=hd0 -device virtio-blk-device,drive=hd0 -drive if=none,file=,id=cdrom,media=cdrom -device virtio-scsi-device -device scsi-cd,drive=cdrom -net nic -net user,hostfwd=tcp::2222-:22,hostfwd=tcp::8033-:38033  -net tap,ifname=tap0

虚拟机密码  
Kylin123123*
