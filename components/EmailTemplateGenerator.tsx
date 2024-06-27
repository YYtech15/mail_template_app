"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Template {
  name: string;
  subject: string;
  body: string;
}

interface Templates {
  [key: string]: Template;
}

const defaultTemplates: Templates = {
  inquiry: {
    name: 'お問い合わせ',
    subject: '{{product}}に関するお問い合わせ',
    body: `拝啓

{{company}}御中

{{product}}について、以下の点についてお問い合わせいたします。

{{inquiryDetails}}

ご回答いただけますと幸いです。

よろしくお願いいたします。

{{sender}}
`
  },
  internshipAbsence: {
    name: 'インターンシップ欠席連絡',
    subject: 'インターンシップ欠席のご連絡',
    body: `{{companyName}}株式会社 {{departmentName}} {{contactPersonName}}様

お世話になっております。 {{affiliation}}{{year}}年の{{myName}}です。

{{internshipDate}}のインターンシップに参加予定でしたが、欠席したく連絡いたしました。
理由は、{{absenceReason}}ためです。

せっかくインターンシップのご案内をいただいたにも関わらず、大変申し訳ございません。 
ご迷惑をおかけしますが、ご容赦の程よろしくお願いいたします。

———————————————
{{myName}}
{{affiliation}}
Mail：{{emailAddress}}
TEL：{{phoneNumber}}
———————————————`
  },
};

const placeholderMap: { [key: string]: string } = {
  product: '商品名',
  company: '会社名',
  inquiryDetails: '問い合わせ内容',
  sender: '送信者名',
  companyName: '会社名',
  departmentName: '部署名',
  contactPersonName: '担当者名',
  affiliation: '所属',
  year: '学年',
  myName: '自分の名前',
  internshipDate: 'インターンシップ日',
  absenceReason: '欠席理由',
  emailAddress: 'メールアドレス',
  phoneNumber: '電話番号',
};

export default function EmailTemplateGenerator() {
  const [templates, setTemplates] = useState<Templates>(defaultTemplates);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [formData, setFormData] = useState<{[key: string]: string}>({});
  const [generatedEmail, setGeneratedEmail] = useState<string>('');
  const [editingTemplate, setEditingTemplate] = useState<(Template & {key: string}) | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);

  useEffect(() => {
    const savedTemplates = localStorage.getItem('emailTemplates');
    if (savedTemplates) {
      setTemplates(JSON.parse(savedTemplates));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('emailTemplates', JSON.stringify(templates));
  }, [templates]);

  const handleTemplateChange = (value: string) => {
    console.log('Selected template:', value); // Debugging line
    setSelectedTemplate(value);
    setFormData({});
    setGeneratedEmail('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({...prev, [name]: value}));
  };

  const generateEmail = () => {
    if (!selectedTemplate) return;

    let subject = templates[selectedTemplate].subject;
    let body = templates[selectedTemplate].body;

    Object.entries(formData).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      subject = subject.replace(regex, value);
      body = body.replace(regex, value);
    });

    setGeneratedEmail(`件名：${subject}\n\n${body}`);
  };

  const renderForm = () => {
    if (!selectedTemplate) return null;

    const template = templates[selectedTemplate];
    const placeholders = [...template.subject.matchAll(/{{(\w+)}}/g), ...template.body.matchAll(/{{(\w+)}}/g)]
      .map(match => match[1])
      .filter((value, index, self) => self.indexOf(value) === index);

    return (
      <div className="space-y-4">
        {placeholders.map(placeholder => (
          <Input
            key={placeholder}
            name={placeholder}
            placeholder={placeholderMap[placeholder] || placeholder}
            value={formData[placeholder] || ''}
            onChange={handleInputChange}
          />
        ))}
      </div>
    );
  };

  const handleEditTemplate = (key: string) => {
    setEditingTemplate({ ...templates[key], key });
    setIsEditDialogOpen(true);
  };

  const handleSaveTemplate = () => {
    if (editingTemplate) {
      const { key, ...templateData } = editingTemplate;
      setTemplates(prev => ({
        ...prev,
        [key]: templateData
      }));
    }
    setIsEditDialogOpen(false);
    setEditingTemplate(null);
  };

  const handleAddNewTemplate = () => {
    const newKey = `template_${Date.now()}`;
    setEditingTemplate({
      key: newKey,
      name: '',
      subject: '',
      body: ''
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteTemplate = (key: string) => {
    setTemplates(prev => {
      const newTemplates = { ...prev };
      delete newTemplates[key];
      return newTemplates;
    });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <h1 className="text-2xl font-bold">メールテンプレートジェネレーター</h1>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <Select onValueChange={handleTemplateChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="テンプレートを選択" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(templates).map(([key, template]) => (
                <SelectItem key={key} value={key}>{template.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleAddNewTemplate}>新規テンプレート</Button>
        </div>

        {selectedTemplate && (
          <>
            <div className="flex justify-end mb-4">
              <Button variant="outline" onClick={() => handleEditTemplate(selectedTemplate)} className="mr-2">
                編集
              </Button>
              <Button variant="destructive" onClick={() => handleDeleteTemplate(selectedTemplate)}>
                削除
              </Button>
            </div>
            <div className="mt-4">
              {renderForm()}
            </div>
            <Button onClick={generateEmail} className="mt-4">メールを生成</Button>
          </>
        )}

        {generatedEmail && (
          <Textarea
            value={generatedEmail}
            readOnly
            className="mt-4"
            rows={10}
          />
        )}
      </CardContent>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTemplate?.key.startsWith('template_') ? '新規テンプレート' : 'テンプレートを編集'}</DialogTitle>
          </DialogHeader>
          {editingTemplate && (
            <div className="space-y-4">
              <Input
                placeholder="テンプレート名"
                value={editingTemplate.name}
                onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
              />
              <Input
                placeholder="件名"
                value={editingTemplate.subject}
                onChange={(e) => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
              />
              <Textarea
                placeholder="本文"
                value={editingTemplate.body}
                onChange={(e) => setEditingTemplate({ ...editingTemplate, body: e.target.value })}
                rows={10}
              />
              <Button onClick={handleSaveTemplate}>保存</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
