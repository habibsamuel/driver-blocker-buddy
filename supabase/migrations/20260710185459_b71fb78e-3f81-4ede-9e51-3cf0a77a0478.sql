
CREATE POLICY "Chauffeur upload sa preuve" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'subscription-proofs' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Chauffeur voit sa preuve" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'subscription-proofs' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(),'admin')));
CREATE POLICY "Chauffeur supprime sa preuve" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'subscription-proofs' AND (storage.foldername(name))[1] = auth.uid()::text);
