---
title: 在 ARM 上新建达梦数据库虚拟机
date: "2025-05-15"
tags: [ARM, 国产化, 麒麟, 运维]
description: "qemu-img create -f qcow2 F:vmwarekylinarmkylindisk.qcow2 40G 初始化虚拟机 qemu-system-aarch64 -m 8192 -cpu cortex-a7..."
published: true
---

# 在 ARM 上新建达梦数据库虚拟机

## 背景（Situation）

国产化适配要求数据库迁到达梦，需要先在 ARM 机器上把达梦虚拟机跑起来用于联调。

## 目标（Task）

按客户给的镜像把达梦虚拟机装上并验证基本能力。

## 行动（Action）

新建虚拟机
qemu-img create -f qcow2 F:vmwarekylinarmkylindisk.qcow2 40G 

初始化虚拟机
qemu-system-aarch64 -m 8192 -cpu cortex-a72 -smp 8,sockets=4,cores=2 -M virt -bios F:vmwarekylinarmQEMU_EFI.fd -device VGA -device nec-usb-xhci -device usb-mouse -device usb-kbd -drive if=none,file=F:vmwarekylinarmkylindisk.qcow2,id=hd0 -device virtio-blk-device,drive=hd0 -drive if=none,file=F:ToolsdevisoKylin-Server-10-SP2-Release-Build09-20210524-arm64.iso,id=cdrom,media=cdrom -device virtio-scsi-device -device scsi-cd,drive=cdrom  -net nic -net user,hostfwd=tcp::2222-:22 

启动虚拟机
qemu-system-aarch64 -m 8192 -cpu cortex-a72 -smp 8,sockets=4,cores=2 -M virt -bios  F:vmwarekylinarmQEMU_EFI.fd -device VGA -device nec-usb-xhci -device usb-mouse -device usb-kbd -drive if=none,file=F:vmwarekylinarmkylindisk.qcow2,id=hd0 -device virtio-blk-device,drive=hd0 -drive if=none,file=,id=cdrom,media=cdrom -device virtio-scsi-device -device scsi-cd,drive=cdrom -net nic -net user,hostfwd=tcp::2222-:22

qemu-system-aarch64 -m 8192 -cpu cortex-a72 -smp 8,sockets=4,cores=2 -M virt -bios  F:vmwarekylinarmQEMU_EFI.fd -device VGA -device nec-usb-xhci -device usb-mouse -device usb-kbd -drive if=none,file=F:vmwarebakkylindisk.qcow2,id=hd0 -device virtio-blk-device,drive=hd0 -drive if=none,file=,id=cdrom,media=cdrom -device virtio-scsi-device -device scsi-cd,drive=cdrom -net nic -net user,hostfwd=tcp::2222-:22

虚拟机密码
Kylin123123*

## 收获（Result）

环境拉起后供联调一直稳定使用，是后续 SQL 兼容测试的基础。

> 这篇笔记最初是工作中的速记，沉淀到博客是希望日后遇到类似问题能直接复用，也欢迎对同样场景有经验的同学一起讨论。
