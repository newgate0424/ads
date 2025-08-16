"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState } from 'react';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';

import { useSettings } from '@/components/settings-provider';
import { colorThemes } from '@/lib/constants';
import { backgroundStyles, fontSizes } from '@/lib/config';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';

const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, { message: "กรุณากรอกรหัสผ่านปัจจุบัน" }),
  newPassword: z.string().min(6, { message: "รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร" }),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "รหัสผ่านใหม่ไม่ตรงกัน",
  path: ["confirmPassword"],
});

type PasswordFormValues = z.infer<typeof passwordFormSchema>;

export default function SettingsPage() {
  const { 
    theme, updateTheme, 
    colorTheme, updateColorTheme, 
    backgroundStyle, updateBackgroundStyle,
    fontSize, updateFontSize,
    isSettingsLoading 
  } = useSettings();

  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onPasswordSubmit = async (data: PasswordFormValues) => {
    setIsSavingPassword(true);
    
    const promise = fetch('/api/user/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      }),
    }).then(async (res) => {
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'เกิดข้อผิดพลาดที่ไม่รู้จัก' }));
        throw new Error(errorData.error || errorData.message);
      }
      return res.json();
    });

    toast.promise(promise, {
      loading: 'กำลังเปลี่ยนรหัสผ่าน...',
      success: () => {
        form.reset();
        return "เปลี่ยนรหัสผ่านสำเร็จ!";
      },
      error: (error) => `เกิดข้อผิดพลาด: ${error.message}`,
      finally: () => {
        setIsSavingPassword(false);
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">การตั้งค่า</h1>
        <p className="text-muted-foreground">จัดการบัญชีและปรับแต่งการแสดงผล</p>
      </div>
      <Separator />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>ลักษณะที่ปรากฏ</CardTitle>
            <CardDescription>ปรับแต่งหน้าตาและสีของแอปพลิเคชัน</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Theme Mode */}
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">โหมดสี</label>
              {isSettingsLoading ? (
                   <div className="flex items-center space-x-2 pt-2">
                      <Skeleton className="h-10 w-20 rounded-md" />
                      <Skeleton className="h-10 w-20 rounded-md" />
                      <Skeleton className="h-10 w-20 rounded-md" />
                   </div>
              ) : (
                  <div className="flex items-center space-x-2 pt-2">
                      <Button variant={theme === 'light' ? 'default' : 'outline'} onClick={() => updateTheme('light')}>สว่าง</Button>
                      <Button variant={theme === 'dark' ? 'default' : 'outline'} onClick={() => updateTheme('dark')}>มืด</Button>
                      <Button variant={theme === 'system' ? 'default' : 'outline'} onClick={() => updateTheme('system')}>ตามระบบ</Button>
                  </div>
              )}
            </div>

            {/* Font Size */}
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">ขนาดข้อความ</label>
              {isSettingsLoading ? (
                <div className="flex items-center space-x-2 pt-2">
                  <Skeleton className="h-10 w-20 rounded-md" />
                  <Skeleton className="h-10 w-20 rounded-md" />
                  <Skeleton className="h-10 w-20 rounded-md" />
                </div>
              ) : (
                <div className="flex items-center space-x-2 pt-2">
                  {fontSizes.map((size) => (
                    <Button 
                      key={size.name}
                      variant={fontSize === size.size ? 'default' : 'outline'} 
                      onClick={() => updateFontSize(size.size)}
                    >
                      {size.name}
                    </Button>
                  ))}
                </div>
              )}
            </div>

            {/* Color Theme */}
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">สีหลักของธีม</label>
               {isSettingsLoading ? (
                   <div className="flex flex-wrap gap-2 pt-2">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-8 w-8 rounded-full" />
                   </div>
               ) : (
                  <TooltipProvider>
                      <div className="flex flex-wrap gap-2 pt-2">
                      {colorThemes.map((c) => {
                          const isActive = colorTheme === c.class;
                          return (
                          <Tooltip key={c.name}>
                              <TooltipTrigger asChild>
                              <Button variant={"outline"} size="icon" className={`h-8 w-8 rounded-full p-0 ${isActive ? 'border-2 border-primary' : ''}`} onClick={() => updateColorTheme(c.class)}>
                                  <span style={{ backgroundColor: c.color }} className="h-5 w-5 rounded-full" />
                                  <span className="sr-only">{c.name}</span>
                              </Button>
                              </TooltipTrigger>
                              <TooltipContent><p className="capitalize">{c.name}</p></TooltipContent>
                          </Tooltip>
                          );
                      })}
                      </div>
                  </TooltipProvider>
               )}
            </div>
            
            {/* Background Style */}
            <div className="space-y-4">
              <label className="text-sm font-medium leading-none">สีพื้นหลัง</label>
              {isSettingsLoading ? (
                <div className="flex items-center space-x-2 pt-2">
                  <Skeleton className="h-16 w-24 rounded-md" />
                  <Skeleton className="h-16 w-24 rounded-md" />
                  <Skeleton className="h-16 w-24 rounded-md" />
                </div>
              ) : (
                  <div className="space-y-2 pt-2">
                      {Object.entries(backgroundStyles).map(([groupName, styles]) => (
                          <div key={groupName} className="flex flex-col gap-2">
                              <span className="text-sm font-semibold text-muted-foreground">{groupName}</span>
                              <div className="flex flex-wrap gap-3">
                                  {styles.map((style) => (
                                      <div key={style.name} className="flex flex-col items-center">
                                          <button
                                              onClick={() => updateBackgroundStyle(style.class)}
                                              className={cn(
                                                  "size-12 rounded-full border-2 transition-all",
                                                  backgroundStyle === style.class ? 'border-primary' : 'border-border hover:border-muted-foreground'
                                              )}
                                          >
                                              <div className={cn("size-full rounded-full", style.previewClass)} />
                                          </button>
                                          <span className="mt-1 text-xs">{style.name}</span>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      ))}
                  </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="self-start">
          <CardHeader>
            <CardTitle>เปลี่ยนรหัสผ่าน</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onPasswordSubmit)} className="space-y-4 max-w-lg">
                <FormField
                  control={form.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>รหัสผ่านปัจจุบัน</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input type={showPassword.current ? 'text' : 'password'} {...field} disabled={isSavingPassword} autoComplete="current-password" />
                          <button type="button" onClick={() => setShowPassword(prev => ({...prev, current: !prev.current}))} className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground">
                            {showPassword.current ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>รหัสผ่านใหม่</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input type={showPassword.new ? 'text' : 'password'} {...field} disabled={isSavingPassword} autoComplete="new-password" />
                          <button type="button" onClick={() => setShowPassword(prev => ({...prev, new: !prev.new}))} className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground">
                            {showPassword.new ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ยืนยันรหัสผ่านใหม่</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input type={showPassword.confirm ? 'text' : 'password'} {...field} disabled={isSavingPassword} autoComplete="new-password" />
                          <button type="button" onClick={() => setShowPassword(prev => ({...prev, confirm: !prev.confirm}))} className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground">
                            {showPassword.confirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isSavingPassword}>
                  {isSavingPassword ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}